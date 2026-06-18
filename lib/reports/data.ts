import { createServiceClient } from "@/lib/supabase/server";

export interface MonthlyReportData {
  month: string;
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
  revenue: number;
  bookingsCount: number;
  newCustomers: number;
  avgTicket: number;
  currency: string;
  weeklyRevenue: { label: string; revenue: number }[];
  bookings: {
    id: string;
    productTitle: string;
    customerName: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  }[];
  topProducts: { title: string; revenue: number; bookings: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
  completed: "Concluída",
};

export { STATUS_LABEL };

/** Computes the monthly executive report for a tenant. `month` is in "YYYY-MM" format. */
export async function getMonthlyReportData(tenantId: string, month: string): Promise<MonthlyReportData> {
  const service = createServiceClient();
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));

  const [{ data: tenant }, { data: theme }, { data: bookings }, { count: newCustomers }] = await Promise.all([
    service.from("tenants").select("name").eq("id", tenantId).single(),
    service.from("themes").select("logo_url, primary_color").eq("tenant_id", tenantId).single(),
    service
      .from("bookings")
      .select("id, total_price, currency, status, created_at, customer_name, products(title)")
      .eq("tenant_id", tenantId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true }),
    service
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
  ]);

  const allBookings = bookings ?? [];
  const confirmed = allBookings.filter((b) => ["confirmed", "completed"].includes(b.status as string));
  const revenue = confirmed.reduce((sum, b) => sum + Number(b.total_price), 0);
  const currency = confirmed[0]?.currency ?? "BRL";
  const avgTicket = confirmed.length ? revenue / confirmed.length : 0;

  const weekBuckets = new Map<number, number>();
  for (const b of confirmed) {
    const day = new Date(b.created_at as string).getUTCDate();
    const week = Math.min(5, Math.ceil(day / 7));
    weekBuckets.set(week, (weekBuckets.get(week) ?? 0) + Number(b.total_price));
  }
  const weeklyRevenue = Array.from({ length: 5 }, (_, i) => ({
    label: `Sem. ${i + 1}`,
    revenue: weekBuckets.get(i + 1) ?? 0,
  }));

  const productMap = new Map<string, { title: string; revenue: number; bookings: number }>();
  for (const b of confirmed) {
    const title = (b.products as unknown as { title: string } | null)?.title ?? "Produto";
    const entry = productMap.get(title) ?? { title, revenue: 0, bookings: 0 };
    entry.revenue += Number(b.total_price);
    entry.bookings += 1;
    productMap.set(title, entry);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    month,
    tenantName: tenant?.name ?? "Empresa",
    logoUrl: theme?.logo_url ?? null,
    primaryColor: theme?.primary_color ?? "#0ea5e9",
    revenue,
    bookingsCount: confirmed.length,
    newCustomers: newCustomers ?? 0,
    avgTicket,
    currency,
    weeklyRevenue,
    bookings: allBookings.map((b) => ({
      id: b.id as string,
      productTitle: (b.products as unknown as { title: string } | null)?.title ?? "Produto",
      customerName: b.customer_name as string,
      status: b.status as string,
      totalPrice: Number(b.total_price),
      createdAt: b.created_at as string,
    })),
    topProducts,
  };
}

export interface RevenueTrendPoint {
  month: string; // "YYYY-MM"
  label: string; // "jun/25"
  revenue: number;
  bookings: number;
}

/**
 * Revenue + confirmed bookings per month for the last `months` months (oldest
 * first), for the historical charts on /relatorios. One query over the window,
 * bucketed in memory.
 */
export async function getRevenueTrend(tenantId: string, months = 6): Promise<RevenueTrendPoint[]> {
  const service = createServiceClient();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data: bookings } = await service
    .from("bookings")
    .select("total_price, status, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  const confirmed = (bookings ?? []).filter((b) => ["confirmed", "completed"].includes(b.status as string));

  const buckets = new Map<string, { revenue: number; bookings: number }>();
  // Pre-seed every month in the window so gaps render as zero bars.
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    buckets.set(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, { revenue: 0, bookings: 0 });
  }
  for (const b of confirmed) {
    const d = new Date(b.created_at as string);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const entry = buckets.get(key);
    if (entry) {
      entry.revenue += Number(b.total_price);
      entry.bookings += 1;
    }
  }

  return Array.from(buckets.entries()).map(([month, v]) => {
    const [y, m] = month.split("-").map(Number);
    const label = new Date(Date.UTC(y, m - 1, 1))
      .toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" })
      .replace(".", "");
    return { month, label, revenue: v.revenue, bookings: v.bookings };
  });
}

export interface ProductReportData {
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
  productTitle: string;
  totalRevenue: number;
  totalBookings: number;
  avgTicket: number;
  currency: string;
  monthlyRevenue: { label: string; revenue: number }[];
  bookings: {
    id: string;
    customerName: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  }[];
}

/** Computes a lifetime performance report for a single product. */
export async function getProductReportData(tenantId: string, productId: string): Promise<ProductReportData | null> {
  const service = createServiceClient();

  const [{ data: tenant }, { data: theme }, { data: product }, { data: bookings }] = await Promise.all([
    service.from("tenants").select("name").eq("id", tenantId).single(),
    service.from("themes").select("logo_url, primary_color").eq("tenant_id", tenantId).single(),
    service.from("products").select("title").eq("id", productId).eq("tenant_id", tenantId).single(),
    service
      .from("bookings")
      .select("id, total_price, currency, status, created_at, customer_name")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .order("created_at", { ascending: true }),
  ]);

  if (!product) return null;

  const allBookings = bookings ?? [];
  const confirmed = allBookings.filter((b) => ["confirmed", "completed"].includes(b.status as string));
  const totalRevenue = confirmed.reduce((sum, b) => sum + Number(b.total_price), 0);
  const currency = confirmed[0]?.currency ?? "BRL";
  const avgTicket = confirmed.length ? totalRevenue / confirmed.length : 0;

  const monthBuckets = new Map<string, number>();
  for (const b of confirmed) {
    const d = new Date(b.created_at as string);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + Number(b.total_price));
  }
  const monthlyRevenue = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, revenue]) => ({ label, revenue }));

  return {
    tenantName: tenant?.name ?? "Empresa",
    logoUrl: theme?.logo_url ?? null,
    primaryColor: theme?.primary_color ?? "#0ea5e9",
    productTitle: product.title,
    totalRevenue,
    totalBookings: confirmed.length,
    avgTicket,
    currency,
    monthlyRevenue,
    bookings: allBookings.map((b) => ({
      id: b.id as string,
      customerName: b.customer_name as string,
      status: b.status as string,
      totalPrice: Number(b.total_price),
      createdAt: b.created_at as string,
    })),
  };
}
