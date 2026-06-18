import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { getMfaGateStatus, type MfaGateResult } from "@/lib/auth/mfa-gate";

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from("user_profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .single();
  return data?.is_super_admin === true;
}

/** MFA/TOTP is mandatory for super admin accounts — see lib/auth/mfa-gate.ts. */
export async function requireAal2ForSuperAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<MfaGateResult> {
  return getMfaGateStatus(supabase, userId, { forceEnroll: true });
}
