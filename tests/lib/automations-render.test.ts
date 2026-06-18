import { describe, it, expect } from "vitest";
import { renderTemplate, addDaysIsoDate } from "@/lib/automations/render";

describe("renderTemplate", () => {
  it("replaces known variables", () => {
    expect(renderTemplate("Olá {{name}}!", { name: "Maria" })).toBe("Olá Maria!");
  });

  it("leaves unknown variables untouched", () => {
    expect(renderTemplate("Olá {{name}}, {{unknown}}!", { name: "Maria" })).toBe("Olá Maria, {{unknown}}!");
  });

  it("replaces multiple occurrences of the same variable", () => {
    expect(renderTemplate("{{name}} e {{name}}", { name: "X" })).toBe("X e X");
  });
});

describe("addDaysIsoDate", () => {
  it("adds positive days", () => {
    expect(addDaysIsoDate(new Date("2026-06-15T12:00:00Z"), 7)).toBe("2026-06-22");
  });

  it("subtracts with negative days", () => {
    expect(addDaysIsoDate(new Date("2026-06-15T12:00:00Z"), -1)).toBe("2026-06-14");
  });

  it("returns the same day for zero days", () => {
    expect(addDaysIsoDate(new Date("2026-06-15T12:00:00Z"), 0)).toBe("2026-06-15");
  });
});
