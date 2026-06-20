import { createClient, createServiceClient } from "@/lib/supabase/server";
import { LeadsKanban } from "@/components/admin/LeadsKanban";
import { normalizePhone } from "@/lib/whatsapp/360dialog";
import { getPlanTier } from "@/lib/plans/limits";
import { proFeatureAllowed } from "@/lib/plans/pro-features";
import { ProFeatureGate } from "@/components/admin/ProFeatureGate";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const service = createServiceClient();
  const planTier = await getPlanTier(service, membership!.tenant_id);
  if (!proFeatureAllowed(planTier)) {
    return (
      <ProFeatureGate
        kind="crm"
        title="CRM comercial"
        description="Leads, pipeline, conversao para cliente e cotacoes ficam visiveis como preview no trial, mas a operacao do CRM e liberada apenas nos planos Pro e Enterprise."
      />
    );
  }

  const [{ data: leads }, { data: convs }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, email, phone, message, status, product_id, created_at, products(title)")
      .eq("tenant_id", membership!.tenant_id)
      .order("created_at", { ascending: false })
      .limit(300),
    service
      .from("conversations")
      .select("id, lead_id, phone")
      .eq("tenant_id", membership!.tenant_id),
  ]);

  // Mapeia conversa por lead_id (explícito) e por telefone (fallback).
  const byLead = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of convs ?? []) {
    if (c.lead_id) byLead.set(c.lead_id as string, c.id as string);
    if (c.phone) byPhone.set(c.phone as string, c.id as string);
  }

  const items = (leads ?? []).map((l) => ({
    ...l,
    product_title: (l.products as unknown as { title: string } | null)?.title ?? null,
    conversation_id: byLead.get(l.id) ?? (l.phone ? byPhone.get(normalizePhone(l.phone)) : undefined) ?? null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">
          Funil de vendas — arraste mentalmente pelos status ou use o seletor em cada cartão.
        </p>
      </div>
      <LeadsKanban initialLeads={items} />
    </div>
  );
}
