import crypto from "crypto";
import { generateToken } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase/server";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** SHA-256 of the invite token. Only the hash is persisted — same pattern as
 *  api_keys.key_hash and mfa_backup_codes.code_hash. */
export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken(): string {
  return `inv_${generateToken(32)}`;
}

export interface TeamLimitResult {
  allowed: boolean;
  max: number; // -1 = unlimited
  used: number; // active members + pending invites
}

/**
 * Whether the tenant can add one more seat, counting BOTH active members and
 * pending (un-accepted, un-revoked, un-expired) invites — so a tenant can't
 * exceed its plan by spamming invites that are all still outstanding.
 */
export async function checkTeamLimit(tenantId: string): Promise<TeamLimitResult> {
  const service = createServiceClient();

  const [{ data: tenant }, membersRes, invitesRes] = await Promise.all([
    service.from("tenants").select("plan_id, plans(limits)").eq("id", tenantId).single(),
    service
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    service
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const limits = (tenant?.plans as unknown as { limits?: { max_team_members?: number } } | null)?.limits;
  const max = typeof limits?.max_team_members === "number" ? limits.max_team_members : 1;
  const used = (membersRes.count ?? 0) + (invitesRes.count ?? 0);

  return {
    allowed: max === -1 || used < max,
    max,
    used,
  };
}
