import { createServiceClient } from "@/lib/supabase/server";
import type { LoyaltyEarnMode } from "@/types";

export interface LoyaltyConfig {
  active: boolean;
  earn_mode: LoyaltyEarnMode;
  points_per_amount: number;
  points_per_booking: number;
  redeem_value_per_point: number;
  min_redeem_points: number;
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltyConfig = {
  active: false,
  earn_mode: "per_amount",
  points_per_amount: 1,
  points_per_booking: 100,
  redeem_value_per_point: 0.1,
  min_redeem_points: 100,
};

export async function getLoyaltySettings(tenantId: string): Promise<LoyaltyConfig> {
  const service = createServiceClient();
  const { data } = await service
    .from("loyalty_settings")
    .select("active, earn_mode, points_per_amount, points_per_booking, redeem_value_per_point, min_redeem_points")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data ?? DEFAULT_LOYALTY_SETTINGS;
}

export function computeEarnedPoints(settings: LoyaltyConfig, totalPrice: number): number {
  if (settings.earn_mode === "per_booking") return settings.points_per_booking;
  return Math.floor(totalPrice * settings.points_per_amount);
}

export function computeRedeemDiscount(
  settings: LoyaltyConfig,
  points: number,
  totalPrice: number
): { points: number; discount: number } {
  const maxDiscount = totalPrice;
  let discount = points * settings.redeem_value_per_point;
  let usedPoints = points;

  if (discount > maxDiscount) {
    discount = maxDiscount;
    usedPoints = Math.ceil(discount / settings.redeem_value_per_point);
  }

  return { points: usedPoints, discount: Math.round(discount * 100) / 100 };
}
