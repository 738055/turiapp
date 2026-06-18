import { describe, it, expect } from "vitest";
import { evaluateCoupon } from "@/lib/coupons/validate";

const base = { type: "percent" as const, value: 10, min_order: 0, max_uses: null, uses_count: 0, expires_at: null, active: true };

describe("evaluateCoupon", () => {
  it("applies a percentage discount", () => {
    const r = evaluateCoupon({ ...base, type: "percent", value: 10 }, 200);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(20);
    expect(r.finalTotal).toBe(180);
  });

  it("applies a fixed discount", () => {
    const r = evaluateCoupon({ ...base, type: "fixed", value: 50 }, 200);
    expect(r.discount).toBe(50);
    expect(r.finalTotal).toBe(150);
  });

  it("never discounts below zero", () => {
    const r = evaluateCoupon({ ...base, type: "fixed", value: 500 }, 200);
    expect(r.discount).toBe(200);
    expect(r.finalTotal).toBe(0);
  });

  it("rejects an inactive coupon", () => {
    const r = evaluateCoupon({ ...base, active: false }, 100);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
  });

  it("rejects an expired coupon", () => {
    const r = evaluateCoupon({ ...base, expires_at: new Date(Date.now() - 1000).toISOString() }, 100);
    expect(r.valid).toBe(false);
  });

  it("rejects an exhausted coupon", () => {
    const r = evaluateCoupon({ ...base, max_uses: 5, uses_count: 5 }, 100);
    expect(r.valid).toBe(false);
  });

  it("enforces the minimum order", () => {
    const r = evaluateCoupon({ ...base, min_order: 150 }, 100);
    expect(r.valid).toBe(false);
    const ok = evaluateCoupon({ ...base, min_order: 150 }, 200);
    expect(ok.valid).toBe(true);
  });

  it("rounds to cents", () => {
    const r = evaluateCoupon({ ...base, type: "percent", value: 15 }, 99.99);
    expect(r.discount).toBe(15);
    expect(r.finalTotal).toBe(84.99);
  });
});
