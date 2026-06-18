import type { createServiceClient } from "@/lib/supabase/server";

type Service = ReturnType<typeof createServiceClient>;

/**
 * When a tenant starts paying, convert its pending referral (if any) and lock in
 * the commission = plan monthly price × the affiliate's commission percent.
 * Idempotent: only acts on a still-pending referral.
 */
export async function convertReferral(service: Service, tenantId: string): Promise<void> {
  const { data: referral } = await service
    .from("affiliate_referrals")
    .select("id, affiliate_id, status")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .maybeSingle();
  if (!referral) return;

  const [{ data: tenant }, { data: affiliate }] = await Promise.all([
    service.from("tenants").select("plans(price_monthly)").eq("id", tenantId).maybeSingle(),
    service.from("affiliates").select("commission_percent").eq("id", referral.affiliate_id).maybeSingle(),
  ]);

  const price = Number((tenant?.plans as unknown as { price_monthly?: number } | null)?.price_monthly ?? 0);
  const percent = Number(affiliate?.commission_percent ?? 0);
  const commission = Math.round(price * (percent / 100) * 100) / 100;

  await service
    .from("affiliate_referrals")
    .update({ status: "converted", commission_amount: commission, converted_at: new Date().toISOString() })
    .eq("id", referral.id)
    .eq("status", "pending");
}
