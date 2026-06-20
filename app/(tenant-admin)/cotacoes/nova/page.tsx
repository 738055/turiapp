import { createClient, createServiceClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/admin/QuoteForm";
import { getPlanTier } from "@/lib/plans/limits";
import { proFeatureAllowed } from "@/lib/plans/pro-features";
import { ProFeatureGate } from "@/components/admin/ProFeatureGate";

export default async function NovaCotacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string; product_id?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const planTier = await getPlanTier(createServiceClient(), membership!.tenant_id);
  if (!proFeatureAllowed(planTier)) {
    return (
      <ProFeatureGate
        kind="crm"
        title="Cotacoes profissionais"
        description="Criar propostas, calcular valores e enviar links de aceite e um recurso dos planos Pro e Enterprise."
      />
    );
  }

  const [{ data: leads }, { data: products }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, email")
      .eq("tenant_id", membership!.tenant_id)
      .in("status", ["novo", "cotacao_enviada", "negociando"])
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("products")
      .select("id, title, rates:product_rates(id, name, price, currency)")
      .eq("tenant_id", membership!.tenant_id)
      .eq("status", "published")
      .order("title"),
  ]);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nova cotação</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monte uma proposta personalizada e envie um link de aceite ao lead.
        </p>
      </div>
      <QuoteForm
        leads={leads ?? []}
        products={products ?? []}
        defaultLeadId={sp.lead_id}
        defaultProductId={sp.product_id}
      />
    </div>
  );
}
