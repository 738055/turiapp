import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export type MfaGateResult = "ok" | "challenge" | "enroll";

// A backup code consumed in the last few minutes counts as an AAL2-equivalent
// for this request. Supabase's native AAL only elevates via auth.mfa.verify(),
// so the custom backup-code path (app/api/auth/mfa/verify-backup) can't elevate
// the session directly — instead we re-check the DB row (used_at) on every
// request within this short window, which keeps the recovery path usable without
// a separate signed-cookie mechanism. Ultimate recovery if both the TOTP device
// and all backup codes are lost is removing the factor directly in Supabase
// Studio (auth.mfa_factors).
const BACKUP_ELEVATION_WINDOW_MS = 15 * 60 * 1000;

/**
 * Evaluates whether the current session satisfies the MFA requirement for a
 * given gate. `forceEnroll: true` means a verified factor is mandatory (super
 * admin); `false` means MFA is opt-in but, once enrolled, must still be
 * challenged at every login (tenant users).
 */
export async function getMfaGateStatus(
  supabase: SupabaseClient,
  userId: string,
  options: { forceEnroll: boolean }
): Promise<MfaGateResult> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return "ok";

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = (factors?.totp?.length ?? 0) > 0;

  if (!hasVerifiedFactor) {
    return options.forceEnroll ? "enroll" : "ok";
  }

  const service = createServiceClient();
  const { data: recentBackup } = await service
    .from("mfa_backup_codes")
    .select("id")
    .eq("user_id", userId)
    .gte("used_at", new Date(Date.now() - BACKUP_ELEVATION_WINDOW_MS).toISOString())
    .limit(1)
    .maybeSingle();

  return recentBackup ? "ok" : "challenge";
}
