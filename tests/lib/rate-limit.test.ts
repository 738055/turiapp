import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, enforceRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within the limit", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit({ key, limit: 5, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }
  });

  it("blocks when limit is exceeded", () => {
    const key = `block-${Date.now()}`;
    for (let i = 0; i < 3; i++) rateLimit({ key, limit: 3, windowMs: 60_000 });
    const r = rateLimit({ key, limit: 3, windowMs: 60_000 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = `reset-${Date.now()}`;
    const opts = { key, limit: 2, windowMs: 10_000 };
    rateLimit(opts);
    rateLimit(opts);
    expect(rateLimit(opts).allowed).toBe(false);

    vi.advanceTimersByTime(11_000);
    expect(rateLimit(opts).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const r1 = rateLimit({ key: "user-A", limit: 1, windowMs: 60_000 });
    const r2 = rateLimit({ key: "user-B", limit: 1, windowMs: 60_000 });
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);

    expect(rateLimit({ key: "user-A", limit: 1, windowMs: 60_000 }).allowed).toBe(false);
    expect(rateLimit({ key: "user-B", limit: 1, windowMs: 60_000 }).allowed).toBe(false);
  });
});

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("falls back to in-memory when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const key = `enforce-local-${Date.now()}`;
    const r1 = await enforceRateLimit({ key, limit: 1, windowMs: 60_000 });
    expect(r1.allowed).toBe(true);
    const r2 = await enforceRateLimit({ key, limit: 1, windowMs: 60_000 });
    expect(r2.allowed).toBe(false);
  });

  it("treats Upstash failure as Redis-unavailable and uses local result only", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    // Module read the env at import time; the fetch path only runs when both are
    // truthy at call time. Force fetch to reject — must not throw, must allow.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const key = `enforce-redisdown-${Date.now()}`;
    const r = await enforceRateLimit({ key, limit: 5, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
  });
});
