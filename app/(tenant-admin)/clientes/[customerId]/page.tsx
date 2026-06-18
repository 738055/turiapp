import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CustomerLgpdActions } from "@/components/admin/CustomerLgpdActions";
import { CustomerNotesEditor } from "@/components/admin/CustomerNotesEditor";
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

interface PageProps {
  params: Promise<{ customerId: string }>;
}

interface TimelineEvent {
  date: string;
  kind: "booking" | "lead" | "quote";
  label: string;
  detail?: string;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;
  const service = createServiceClient();

  const [{ data: customer }, { data: bookings }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, tenant_id, name, email, phone, tags, internal_notes, created_at")
      .eq("id", customerId)
      .eq("tenant_id", tenantId)
      .single(),
    supabase
      .from("bookings")
      .select("id, status, total_price, currency, check_in, created_at, products(title)")
      .eq("customer_id", customerId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    service.from("crm_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  if (!customer) notFound();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, message, source, created_at")
    .eq("tenant_id", tenantId)
    .eq("email", customer.email)
    .order("created_at", { ascending: false });

  const leadIds = (leads ?? []).map((l) => l.id);
  const { data: quotes } = leadIds.length
    ? await supabase
        .from("quotes")
        .select("id, status, total_price, currency, sent_at, responded_at, created_at")
        .eq("tenant_id", tenantId)
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; status: string; total_price: number; currency: string; sent_at: string | null; responded_at: string | null; created_at: string }[] };

  const totalSpent = bookings
    ?.filter((b) => b.status !== "cancelled" && b.status !== "refunded")
    .reduce((sum, b) => sum + b.total_price, 0) ?? 0;

  const settings = settingsRow ?? DEFAULT_CRM_SETTINGS;
  const tier = computeTier(totalSpent, settings);
  const segment = computeSegment(
    {
      bookingsCount: bookings?.filter((b) => b.status !== "cancelled" && b.status !== "refunded").length ?? 0,
      firstBookingAt: bookings?.length ? bookings[bookings.length - 1].created_at : null,
      lastBookingAt: bookings?.length ? bookings[0].created_at : null,
    },
    settings
  );

  const timeline: TimelineEvent[] = [
    ...(bookings ?? []).map((b) => ({
      date: b.created_at,
      kind: "booking" as const,
      label: `Reserva: ${(b.products as unknown as { title: string } | null)?.title ?? "produto"}`,
      detail: `${formatCurrency(b.total_price, b.currency)} · ${b.status}`,
    })),
    ...(leads ?? []).map((l) => ({
      date: l.created_at,
      kind: "lead" as const,
      label: `Lead recebido (${l.source})`,
      detail: l.message ?? l.status,
    })),
    ...(quotes ?? []).flatMap((q) => {
      const events: TimelineEvent[] = [
        {
          date: q.created_at,
          kind: "quote" as const,
          label: `Cotação criada — ${formatCurrency(q.total_price, q.currency)}`,
          detail: q.status,
        },
      ];
      if (q.responded_at) {
        events.push({
          date: q.responded_at,
          kind: "quote",
          label: q.status === "accepted" ? "Cotação aceita pelo cliente" : "Cotação recusada pelo cliente",
        });
      }
      return events;
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-sky-50 flex items-center justify-center text-2xl font-bold text-sky-600">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-gray-400 text-sm">{customer.email}</p>
          <div className="flex gap-1.5 mt-1.5">
            <Badge variant={TIER_BADGE_VARIANT[tier]}>{TIER_LABEL[tier]}</Badge>
            <Badge variant={SEGMENT_BADGE_VARIANT[segment]}>{SEGMENT_LABEL[segment]}</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Reservas</p>
            <p className="text-2xl font-bold mt-1">{bookings?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total gasto</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent, "BRL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Cliente desde</p>
            <p className="text-sm font-medium mt-1">
              {new Date(customer.created_at).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dados de contato</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">E-mail</span>
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex justify-between">
              <span className="text-gray-400">Telefone</span>
              <span>{customer.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de reservas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {bookings?.map((b) => {
            const product = b.products as unknown as { title: string } | null;
            return (
              <div key={b.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div>
                  <p className="font-medium">{product?.title}</p>
                  {b.check_in && (
                    <p className="text-xs text-gray-400">
                      {new Date(b.check_in).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(b.total_price, b.currency)}</span>
                  <Badge
                    variant={
                      b.status === "confirmed" || b.status === "completed" ? "success"
                      : b.status === "cancelled" ? "destructive"
                      : "secondary"
                    }
                  >
                    {b.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reservas/${b.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            );
          })}
          {!bookings?.length && (
            <p className="text-sm text-gray-400 py-2">Nenhuma reserva encontrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Tags & internal notes */}
      <CustomerNotesEditor
        tenantId={tenantId}
        customerId={customer.id}
        initialTags={customer.tags ?? []}
        initialNotes={customer.internal_notes ?? ""}
      />

      {/* 360° timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico 360°</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm py-1.5 border-b last:border-0">
              <Badge
                variant={event.kind === "booking" ? "success" : event.kind === "quote" ? "warning" : "secondary"}
                className="shrink-0 mt-0.5"
              >
                {event.kind === "booking" ? "Reserva" : event.kind === "quote" ? "Cotação" : "Lead"}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{event.label}</p>
                {event.detail && <p className="text-xs text-gray-400">{event.detail}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(event.date).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
          {!timeline.length && (
            <p className="text-sm text-gray-400 py-2">Nenhum evento registrado ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* LGPD */}
      <CustomerLgpdActions
        tenantId={tenantId}
        customerEmail={customer.email}
        customerName={customer.name}
      />
    </div>
  );
}
