import { describe, it, expect } from "vitest";
import { slugify, formatCurrency, cn } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Bolinha Tur")).toBe("bolinha-tur");
  });

  it("removes accents", () => {
    expect(slugify("Passeio de Barco Pôr do Sol")).toBe("passeio-de-barco-por-do-sol");
  });

  it("removes special characters", () => {
    expect(slugify("Turismo & Aventura!")).toBe("turismo-aventura");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("A  B---C")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Viagem  ")).toBe("viagem");
  });
});

describe("formatCurrency", () => {
  it("formats BRL correctly", () => {
    const result = formatCurrency(1234.56, "BRL");
    expect(result).toContain("1.234,56");
    expect(result).toContain("R$");
  });

  it("formats USD correctly", () => {
    const result = formatCurrency(99.9, "USD");
    expect(result).toContain("99");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
