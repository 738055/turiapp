import { createClient, createServiceClient } from "@/lib/supabase/server";
import { LeadsKanban } from "@/components/admin/LeadsKanban";
import { normalizePhone } from "@/lib/whatsapp/360dialog";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const [{ data: leads }, { data: convs }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, email, phone, message, status, product_id, created_at, products(title)")
      .eq("tenant_id", membership!.tenant_id)
      .order("created_at", { ascending: false })
      .limit(300),
    createServiceClient()
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
