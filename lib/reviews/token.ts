import crypto from "crypto";
import { generateToken } from "@/lib/crypto";

/** SHA-256 of the review link token. Only the hash is persisted (same pattern as
 *  invites/api_keys/mfa backup codes). The plaintext lives only in the email link. */
export function hashReviewToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateReviewToken(): string {
  return `rev_${generateToken(24)}`;
}
