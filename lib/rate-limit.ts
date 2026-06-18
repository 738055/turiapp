// In-memory rate limiter for edge/serverless without Upstash
// For production with high traffic, replace with Upstash Redis rate limiting.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  const allowed = entry.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Distributed rate limiting (Upstash Redis) — ADDITIVE layer (Etapa 28).
//
// The in-memory limiter above is per-serverless-instance: on Vercel, with many
// concurrent invocations, a distributed attacker bypasses it entirely. When
// UPSTASH_REDIS_REST_URL/TOKEN are configured we add a SECOND, shared counter
// in Redis. We never remove the in-memory check — `enforceRateLimit` requires
// BOTH layers to allow, so the effective limit is the stricter of the two and
// the in-memory layer keeps working even if Redis is unreachable (fail-open on
// Redis only, never on the local layer). This only ever tightens, never loosens.
// ─────────────────────────────────────────────────────────────────────────

export function isDistributedRateLimitEnabled(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Fixed-window counter in Redis via the Upstash REST pipeline: INCR the key and,
 * on the first hit of the window, set its TTL. Returns null if Upstash is not
 * configured or the call fails — callers must treat null as "Redis unavailable"
 * and fall back to the in-memory result, never as "allowed".
 */
async function upstashRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `rl:${key}`;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(windowMs), "NX"],
      ]),
      // Never let a slow Redis hang the request path.
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const count = data?.[0]?.result;
    if (typeof count !== "number") return null;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + windowMs,
    };
  } catch {
    // Redis unreachable/timeout — fall back to the local layer only.
    return null;
  }
}

/**
 * Enforce a rate limit across BOTH the in-memory layer (always on) and the
 * distributed Redis layer (when configured). Allowed only if both agree.
 * Use this on hot abuse paths: login, checkout, public API.
 */
export async function enforceRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const local = rateLimit(opts);
  const distributed = await upstashRateLimit(opts);

  if (!distributed) return local;

  return {
    allowed: local.allowed && distributed.allowed,
    remaining: Math.min(local.remaining, distributed.remaining),
    resetAt: Math.max(local.resetAt, distributed.resetAt),
  };
}
