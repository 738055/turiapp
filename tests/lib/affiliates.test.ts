import { describe, it, expect } from "vitest";
import { generateAffiliateCode } from "@/lib/affiliates";

describe("generateAffiliateCode", () => {
  it("includes a sanitized name stem", () => {
    const code = generateAffiliateCode("João Silva!");
    expect(code.startsWith("joosilva-")).toBe(true);
  });

  it("produces a cookie-safe code (matches the proxy ref guard)", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateAffiliateCode("Maria");
      expect(code).toMatch(/^[a-zA-Z0-9_-]{3,40}$/);
    }
  });

  it("works without a name", () => {
    const code = generateAffiliateCode();
    expect(code.length).toBeGreaterThanOrEqual(3);
    expect(code).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});
