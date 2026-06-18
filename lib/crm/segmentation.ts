export interface CrmSettings {
  tier_prata_min: number;
  tier_ouro_min: number;
  tier_vip_min: number;
  risk_days: number;
  lost_days: number;
  new_days: number;
}

export const DEFAULT_CRM_SETTINGS: CrmSettings = {
  tier_prata_min: 500,
  tier_ouro_min: 2000,
  tier_vip_min: 8000,
  risk_days: 90,
  lost_days: 180,
  new_days: 30,
};

export type CustomerTier = "bronze" | "prata" | "ouro" | "vip";

export function computeTier(totalSpent: number, settings: CrmSettings): CustomerTier {
  if (totalSpent >= settings.tier_vip_min) return "vip";
  if (totalSpent >= settings.tier_ouro_min) return "ouro";
  if (totalSpent >= settings.tier_prata_min) return "prata";
  return "bronze";
}

export type CustomerSegment = "novo" | "ativo" | "recorrente" | "em_risco" | "perdido";

export interface CustomerActivity {
  bookingsCount: number;
  firstBookingAt: string | null;
  lastBookingAt: string | null;
}

export function computeSegment(
  activity: CustomerActivity,
  settings: CrmSettings,
  now: Date = new Date()
): CustomerSegment {
  if (!activity.lastBookingAt) return "novo";

  const daysSinceFirst = daysBetween(new Date(activity.firstBookingAt ?? activity.lastBookingAt), now);
  const daysSinceLast = daysBetween(new Date(activity.lastBookingAt), now);

  if (daysSinceFirst <= settings.new_days) return "novo";
  if (daysSinceLast >= settings.lost_days) return "perdido";
  if (daysSinceLast >= settings.risk_days) return "em_risco";
  if (activity.bookingsCount >= 2) return "recorrente";
  return "ativo";
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const TIER_LABEL: Record<CustomerTier, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  vip: "VIP",
};

export const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  novo: "Novo",
  ativo: "Ativo",
  recorrente: "Recorrente",
  em_risco: "Em risco",
  perdido: "Perdido",
};
