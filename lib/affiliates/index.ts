import { generateToken } from "@/lib/crypto";

/** Human-ish referral code: optional name stem + short random suffix. */
export function generateAffiliateCode(name?: string): string {
  const stem = (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const rand = generateToken(6).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "ref";
  return stem ? `${stem}-${rand}` : rand;
}
