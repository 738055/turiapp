import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

beforeAll(() => {
  // 64 hex chars = 32 bytes for AES-256
  process.env.ENCRYPTION_KEY = "a".repeat(64);
});

describe("crypto", () => {
  it("encrypts and decrypts a plain string", () => {
    const original = "sk_test_secret_key_12345";
    const ciphertext = encrypt(original);
    expect(ciphertext).not.toBe(original);
    expect(decrypt(ciphertext)).toBe(original);
  });

  it("produces different ciphertexts for the same input (random IV)", () => {
    const plain = "same-input";
    const c1 = encrypt(plain);
    const c2 = encrypt(plain);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plain);
    expect(decrypt(c2)).toBe(plain);
  });

  it("handles special characters and JSON strings", () => {
    const json = JSON.stringify({ secret_key: "sk_live_abc", webhook_secret: "whsec_xyz" });
    expect(decrypt(encrypt(json))).toBe(json);
  });

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("sensitive");
    const buf = Buffer.from(ciphertext, "base64");
    buf[buf.length - 1] ^= 0xff; // Flip last byte
    expect(() => decrypt(buf.toString("base64"))).toThrow();
  });
});
