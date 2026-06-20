import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";
import { getPlanTier } from "@/lib/plans/limits";
import { proFeatureAllowed } from "@/lib/plans/pro-features";
import { ProFeatureGate } from "@/components/admin/ProFeatureGate";
import {
  computeTier,
  computeSegment,
  DEFAULT_CRM_SETTINGS,
  TIER_LABEL,
  SEGMENT_LABEL,
  type CustomerTier,
  type CustomerSegment,
} from "@/lib/crm/segmentation";

const TIER_BADGE_VARIANT: Record<CustomerTier, "secondary" | "default" | "warning" | "success"> = {
  bronze: "secondary",
  prata: "default",
  ouro: "warning",
  vip: "success",
};

const SEGMENT_BADGE_VARIANT: Record<CustomerSegment, "default" | "success" | "secondary" | "warning" | "destructive"> = {
  novo: "default",
  ativo: "success",
  recorrente: "success",
  em_risco: "warning",
  perdido: "destructive",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; segment?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;
  const service = createServiceClient();
  const planTier = await getPlanTier(service, tenantId);
  if (!proFeatureAllowed(planTier)) {
    return (
      <ProFeatureGate
        kind="crm"
        title="Clientes e segmentacao"
        description="No trial voce consegue conhecer a area de clientes, mas filtros, historico comercial, tags e segmentacao automatica ficam disponiveis apenas nos planos Pro e Enterprise."
      />
    );
  }

  let customersQuery = supabase
    .from("customers")
    .select("id, name, email, phone, tags, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.q) customersQuery = customersQuery.ilike("name", `%${sp.q}%`).or(`email.ilike.%${sp.q}%`);

  const [{ data: settingsRow }, { data: customers }, { data: bookings }] = await Promise.all([
    service.from("crm_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    customersQuery,
    supabase.from("bookings").select("customer_id, total_price, status, created_at").eq("tenant_id", tenantId),
  ]);

  const settings = settingsRow ?? DEFAULT_CRM_SETTINGS;

  interface Activity {
    totalSpent: number;
    bookingsCount: number;
    firstBookingAt: string | null;
    lastBookingAt: string | null;
  }

  const activityByCustomer = new Map<string, Activity>();
  for (const b of bookings ?? []) {
    if (!b.customer_id || b.status === "cancelled" || b.status === "refunded") continue;
    const entry = activityByCustomer.get(b.customer_id) ?? {
      totalSpent: 0,
      bookingsCount: 0,
      firstBookingAt: null,
      lastBookingAt: null,
    };
    entry.totalSpent += b.total_price;
    entry.bookingsCount += 1;
    if (!entry.firstBookingAt || b.created_at < entry.firstBookingAt) entry.firstBookingAt = b.created_at;
    if (!entry.lastBookingAt || b.created_at > entry.lastBookingAt) entry.lastBookingAt = b.created_at;
    activityByCustomer.set(b.customer_id, entry);
  }

  const enriched = (customers ?? []).map((c) => {
    const activity = activityByCustomer.get(c.id) ?? {
      totalSpent: 0,
      bookingsCount: 0,
      firstBookingAt: null,
      lastBookingAt: null,
    };
    return {
      ...c,
      tags: c.tags ?? [],
      tier: computeTier(activity.totalSpent, settings),
      segment: computeSegment(activity, settings),
    };
  });

  const filtered = enriched.filter((c) => {
    if (sp.segment && c.segment !== sp.segment) return false;
    if (sp.tag && !c.tags.includes(sp.tag)) return false;
    return true;
  });

  const allTags = Array.from(new Set(enriched.flatMap((c) => c.tags))).sort();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} de {enriched.length} clientes cadastrados
          </p>
        </div>
      </div>

      {/* Search & filters */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Buscar por nome ou e-mail..."
          className="flex-1 min-w-[200px] rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select
          name="segment"
          defaultValue={sp.segment ?? ""}
          className="rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Todos os segmentos</option>
          {Object.entries(SEGMENT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            name="tag"
            defaultValue={sp.tag ?? ""}
            className="rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Todas as tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        {(sp.q || sp.segment || sp.tag) && (
          <Button asChild variant="outline" size="sm">
            <Link href="/clientes">Limpar</Link>
          </Button>
        )}
      </form>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={TIER_BADGE_VARIANT[c.tier]}>{TIER_LABEL[c.tier]}</Badge>
                <Badge variant={SEGMENT_BADGE_VARIANT[c.segment]}>{SEGMENT_LABEL[c.segment]}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clientes/${c.id}`}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filtered.length && (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Os clientes aparecem automaticamente ao fazer uma reserva.</p>
        </div>
      )}
    </div>
  );
}
