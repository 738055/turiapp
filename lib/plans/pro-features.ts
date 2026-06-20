import type { PlanTier } from "@/types";
import type { createServiceClient } from "@/lib/supabase/server";

type Service = ReturnType<typeof createServiceClient>;

export type ProFeature = "crm" | "support";

export function proFeatureAllowed(tier: PlanTier | null): boolean {
  return tier === "pro" || tier === "premium";
}

export function proFeatureError(feature: ProFeature): string {
  const label = feature === "support" ? "Atendimento" : "CRM";
  return `${label} esta disponivel nos planos Pro e Enterprise.`;
}

export async function tenantHasProFeature(service: Service, tenantId: string): Promise<boolean> {
  const { data } = await service
    .from("tenants")
    .select("plan_id, plans(tier)")
    .eq("id", tenantId)
    .maybeSingle();
  const tier = (data?.plans as unknown as { tier?: string } | null)?.tier;
  return tier === "pro" || tier === "premium";
}
