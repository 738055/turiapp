import crypto from "crypto";

// Avoids visually ambiguous characters (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;
const BACKUP_CODE_COUNT = 10;

export function generateBackupCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, generateBackupCode);
}

function normalizeBackupCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Same SHA-256 pattern as hashApiKey (lib/api-keys/auth.ts) — only the hash is ever persisted. */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(normalizeBackupCode(code)).digest("hex");
}
