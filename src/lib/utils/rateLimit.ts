import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

// The Upstash REST client requires an https:// URL — guard against a
// misconfigured rediss:// (ioredis-style) connection string so rate limiting
// degrades to a no-op instead of crashing at module load.
const redis =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://") && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// SECURITY.md 4.2 — per-route rate limit tiers
const RATE_LIMIT_TIERS = {
  upload: { requests: 10, window: "1 h" as const },
  collections: { requests: 100, window: "1 m" as const },
  ordinals: { requests: 30, window: "1 m" as const },
  metadata: { requests: 20, window: "1 m" as const },
  profile: { requests: 10, window: "1 m" as const },
  activity: { requests: 30, window: "1 m" as const },
  stats: { requests: 60, window: "1 m" as const },
  marketplace: { requests: 20, window: "1 m" as const },
} satisfies Record<string, { requests: number; window: `${number} ${"s" | "m" | "h"}` }>;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

const limiters: Partial<Record<RateLimitTier, Ratelimit>> = {};

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  if (!redis) return null;
  if (!limiters[tier]) {
    const { requests, window } = RATE_LIMIT_TIERS[tier];
    limiters[tier] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${tier}`,
    });
  }
  return limiters[tier]!;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}

// Returns a 429 response if the request should be blocked, or null to proceed.
// No-ops (always allows) when Upstash credentials aren't configured.
export async function rateLimit(request: NextRequest, tier: RateLimitTier): Promise<NextResponse | null> {
  const limiter = getLimiter(tier);
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(`${tier}:${getClientIp(request)}`);
  if (success) return null;

  return NextResponse.json<ApiResponse<never>>(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}
