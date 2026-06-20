import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { QuoteActions } from "@/components/admin/QuoteActions";
import { getPlanTier } from "@/lib/plans/limits";
import { proFeatureAllowed } from "@/lib/plans/pro-features";
import { ProFeatureGate } from "@/components/admin/ProFeatureGate";

const STATUS_LABEL: Record<string, { label: string; variant: "secondary" | "success" | "destructive" | "warning" }> = {
  pending: { label: "Aguardando resposta", variant: "warning" },
  accepted: { label: "Aceita", variant: "success" },
  declined: { label: "Recusada", variant: "destructive" },
  expired: { label: "Expirada", variant: "secondary" },
};

export default async function CotacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(slug)")
    .eq("user_id", user!.id)
    .single();

  const tenantSlug = (membership?.tenants as unknown as { slug: string } | null)?.slug ?? "";
  const service = createServiceClient();
  const planTier = await getPlanTier(service, membership!.tenant_id);
  if (!proFeatureAllowed(planTier)) {
    return (
      <ProFeatureGate
        kind="crm"
        title="Cotacoes profissionais"
        description="No trial voce ve o fluxo comercial, mas criar propostas, enviar links de aceite e acompanhar resposta do lead fica liberado apenas nos planos Pro e Enterprise."
      />
    );
  }

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, status, total_price, currency, expires_at, sent_at, token, created_at, leads(name, email), products(title)")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const items = (quotes ?? []).map((q) => ({
    ...q,
    lead: q.leads as unknown as { name: string; email: string } | null,
    product: q.products as unknown as { title: string } | null,
  }));

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotações</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} cotações criadas</p>
        </div>
        <Button asChild size="sm">
          <Link href="/cotacoes/nova"><Plus className="h-4 w-4 mr-1" /> Nova cotação</Link>
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((q) => {
          const status = STATUS_LABEL[q.status] ?? STATUS_LABEL.pending;
          const quoteUrl = `https://${tenantSlug}.${platformDomain}/cotacao/${q.token}`;
          return (
            <div key={q.id} className="rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm">{q.product?.title ?? "Produto"}</p>
                <p className="text-xs text-gray-400">{q.lead?.name} · {q.lead?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  R$ {q.total_price.toFixed(2).replace(".", ",")} · expira em {new Date(q.expires_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <QuoteActions quoteId={q.id} quoteUrl={quoteUrl} sent={!!q.sent_at} statusLabel={status.label} statusVariant={status.variant} />
            </div>
          );
        })}
      </div>

      {!items.length && (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Nenhuma cotação ainda</p>
          <p className="text-sm mt-1">Crie cotações a partir de um lead em /leads.</p>
        </div>
      )}
    </div>
  );
}
