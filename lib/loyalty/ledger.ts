import { createServiceClient } from "@/lib/supabase/server";
import type { LoyaltyPoint } from "@/types";

export async function getLoyaltyBalance(tenantId: string, customerId: string): Promise<number> {
  const service = createServiceClient();
  const { data } = await service
    .from("loyalty_points")
    .select("points, type")
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId);

  return (data ?? []).reduce((sum, row) => sum + (row.type === "earn" ? row.points : -row.points), 0);
}

export async function getLoyaltyHistory(tenantId: string, customerId: string, limit = 50): Promise<LoyaltyPoint[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("loyalty_points")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export interface LoyaltyRankEntry {
  customerId: string;
  name: string;
  email: string;
  balance: number;
}

export async function getLoyaltyRanking(tenantId: string, limit = 10): Promise<LoyaltyRankEntry[]> {
  const service = createServiceClient();
  const { data: points } = await service
    .from("loyalty_points")
    .select("customer_id, points, type")
    .eq("tenant_id", tenantId);

  const balances = new Map<string, number>();
  for (const row of points ?? []) {
    const delta = row.type === "earn" ? row.points : -row.points;
    balances.set(row.customer_id, (balances.get(row.customer_id) ?? 0) + delta);
  }

  const customerIds = [...balances.keys()];
  if (!customerIds.length) return [];

  const { data: customers } = await createServiceClient()
    .from("customers")
    .select("id, name, email")
    .in("id", customerIds);

  return (customers ?? [])
    .map((c) => ({ customerId: c.id, name: c.name, email: c.email, balance: balances.get(c.id) ?? 0 }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
