import { describe, it, expect } from "vitest";
import { computeTier, computeSegment, DEFAULT_CRM_SETTINGS } from "@/lib/crm/segmentation";

describe("computeTier", () => {
  it("classifies bronze below all thresholds", () => {
    expect(computeTier(100, DEFAULT_CRM_SETTINGS)).toBe("bronze");
  });

  it("classifies prata, ouro, vip at thresholds", () => {
    expect(computeTier(500, DEFAULT_CRM_SETTINGS)).toBe("prata");
    expect(computeTier(2000, DEFAULT_CRM_SETTINGS)).toBe("ouro");
    expect(computeTier(8000, DEFAULT_CRM_SETTINGS)).toBe("vip");
  });

  it("respects custom tenant thresholds", () => {
    const settings = { ...DEFAULT_CRM_SETTINGS, tier_prata_min: 50, tier_ouro_min: 100, tier_vip_min: 200 };
    expect(computeTier(60, settings)).toBe("prata");
    expect(computeTier(150, settings)).toBe("ouro");
  });
});

describe("computeSegment", () => {
  const now = new Date("2026-06-15T00:00:00Z");

  it("returns novo when there is no booking history", () => {
    expect(computeSegment({ bookingsCount: 0, firstBookingAt: null, lastBookingAt: null }, DEFAULT_CRM_SETTINGS, now))
      .toBe("novo");
  });

  it("returns novo when first booking is within new_days", () => {
    const segment = computeSegment(
      { bookingsCount: 1, firstBookingAt: "2026-06-01T00:00:00Z", lastBookingAt: "2026-06-01T00:00:00Z" },
      DEFAULT_CRM_SETTINGS,
      now
    );
    expect(segment).toBe("novo");
  });

  it("returns perdido after lost_days without booking", () => {
    const segment = computeSegment(
      { bookingsCount: 1, firstBookingAt: "2025-01-01T00:00:00Z", lastBookingAt: "2025-01-01T00:00:00Z" },
      DEFAULT_CRM_SETTINGS,
      now
    );
    expect(segment).toBe("perdido");
  });

  it("returns em_risco between risk_days and lost_days", () => {
    const segment = computeSegment(
      { bookingsCount: 1, firstBookingAt: "2026-01-01T00:00:00Z", lastBookingAt: "2026-01-01T00:00:00Z" },
      DEFAULT_CRM_SETTINGS,
      now
    );
    expect(segment).toBe("em_risco");
  });

  it("returns recorrente for repeat customers active recently", () => {
    const segment = computeSegment(
      { bookingsCount: 3, firstBookingAt: "2026-01-10T00:00:00Z", lastBookingAt: "2026-06-01T00:00:00Z" },
      DEFAULT_CRM_SETTINGS,
      now
    );
    expect(segment).toBe("recorrente");
  });

  it("returns ativo for a single recent booking outside the new window", () => {
    const segment = computeSegment(
      { bookingsCount: 1, firstBookingAt: "2026-01-10T00:00:00Z", lastBookingAt: "2026-06-01T00:00:00Z" },
      DEFAULT_CRM_SETTINGS,
      now
    );
    expect(segment).toBe("ativo");
  });
});
