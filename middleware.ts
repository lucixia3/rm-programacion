import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";

  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasUpstash) return NextResponse.next();

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, "1 m"),
    });
    const { success, reset } = await ratelimit.limit(`middleware:${ip}`);
    if (!success) {
      return new NextResponse(JSON.stringify({ error: "Demasiadas solicitudes." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
      });
    }
  } catch (e) {
    console.error("Rate limit error:", e);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
