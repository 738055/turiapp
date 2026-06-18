import { describe, it, expect } from "vitest";
import { generateBackupCode, generateBackupCodes, hashBackupCode } from "@/lib/mfa/backup-codes";

describe("mfa/backup-codes", () => {
  it("generates codes in XXXXX-XXXXX format using the restricted alphabet", () => {
    const code = generateBackupCode();
    expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it("generates the requested number of distinct codes", () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("hashes deterministically and never returns the plaintext", () => {
    const code = "ABCDE-FGH23";
    const hash = hashBackupCode(code);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(code);
    expect(hashBackupCode(code)).toBe(hash);
  });

  it("normalizes case and separators before hashing, so input variants match", () => {
    const canonical = hashBackupCode("ABCDE-FGH23");
    expect(hashBackupCode("abcde-fgh23")).toBe(canonical);
    expect(hashBackupCode("ABCDEFGH23")).toBe(canonical);
    expect(hashBackupCode(" ABCDE FGH23 ")).toBe(canonical);
  });

  it("produces a different hash for a different code", () => {
    expect(hashBackupCode("AAAAA-AAAAA")).not.toBe(hashBackupCode("BBBBB-BBBBB"));
  });
});
