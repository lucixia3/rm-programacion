import { type NextRequest, NextResponse } from "next/server";

// ─── Estrategia 1: In-memory (desarrollo / instancia única) ──────────────────
// NOTA: Solo funciona en runtime Node.js. En edge (isolates por request)
// el estado no persiste — usar Upstash para producción en edge.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface InMemoryOptions {
  windowMs: number;
  maxRequests: number;
}

function inMemoryRateLimit(
  identifier: string,
  options: InMemoryOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── Estrategia 2: Upstash Redis (producción, distribuido, compatible con edge) ─
// Se inicializa de forma lazy para no romper cuando las env vars no están presentes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let upstashLimiter: any = null;

async function getUpstashLimiter() {
  if (upstashLimiter) return upstashLimiter;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  upstashLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests / minuto por IP
    analytics: true,
  });

  return upstashLimiter;
}

// ─── Helper unificado: elige Upstash si está configurado, sino in-memory ─────
/**
 * Verifica el rate limit para el identificador dado.
 * Retorna null si se permite el request, o un NextResponse 429 si se bloquea.
 */
export async function checkRateLimit(
  identifier: string
): Promise<NextResponse | null> {
  const hasUpstash =
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    const limiter = await getUpstashLimiter();
    const { success, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor espera un momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    return null;
  }

  // Fallback: in-memory (20 requests / minuto)
  const result = inMemoryRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 20,
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Por favor espera un momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

/**
 * Extrae el identificador del cliente (IP) de la request.
 * Considera headers de proxies / CDNs.
 */
export function getIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}
