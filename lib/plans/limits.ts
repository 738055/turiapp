import type { createServiceClient } from "@/lib/supabase/server";
import type { PlanTier } from "@/types";

type Service = ReturnType<typeof createServiceClient>;

export interface PlanLimits {
  max_products?: number;
  max_pages?: number;
  custom_domain?: boolean;
  pixel_integrations?: boolean;
  booking_engine?: boolean;
  max_team_members?: number;
}

export type BooleanFeature = "custom_domain" | "pixel_integrations" | "booking_engine";

/**
 * The tenant's plan limits, or null when there's no plan yet (during the trial).
 * Trial = full access, matching the existing product-count behavior — features
 * are only gated once the tenant is on a paid plan.
 */
export async function getPlanLimits(service: Service, tenantId: string): Promise<PlanLimits | null> {
  const { data } = await service
    .from("tenants")
    .select("plan_id, plans(limits)")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data?.plan_id) return null;
  return (data.plans as unknown as { limits?: PlanLimits } | null)?.limits ?? null;
}

export async function getPlanTier(service: Service, tenantId: string): Promise<PlanTier | null> {
  const { data } = await service
    .from("tenants")
    .select("plan_id, plans(tier)")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data?.plan_id) return null;
  const tier = (data.plans as unknown as { tier?: string } | null)?.tier;
  return tier === "basico" || tier === "pro" || tier === "premium" ? tier : null;
}

/** A boolean feature is allowed during the trial (no plan) or when the plan
 *  doesn't explicitly deny it. Only an explicit `false` blocks. */
export function featureAllowed(limits: PlanLimits | null, feature: BooleanFeature): boolean {
  if (!limits) return true;
  return limits[feature] !== false;
}
