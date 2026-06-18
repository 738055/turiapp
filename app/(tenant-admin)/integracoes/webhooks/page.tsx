import { createClient } from "@/lib/supabase/server";
import { IntegracoesTabs } from "@/components/admin/IntegracoesTabs";
import { WebhookManager } from "@/components/admin/WebhookManager";

export default async function WebhooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;

  const [{ data: endpoints }, { data: deliveries }] = await Promise.all([
    supabase
      .from("webhook_endpoints")
      .select("id, tenant_id, url, events, active, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("webhook_deliveries")
      .select("*, webhook_endpoints(url)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Integrações & SEO</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure webhooks de saída para conectar com Zapier, Make, RD Station, HubSpot e outras ferramentas.
        </p>
      </div>
      <IntegracoesTabs />
      <WebhookManager tenantId={tenantId} endpoints={endpoints ?? []} deliveries={deliveries ?? []} />
    </div>
  );
}
