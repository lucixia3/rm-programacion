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

export async function checkRateLimit(
  identifier: string
): Promise<NextResponse | null> {
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
