import { createClient, createServiceClient } from "@/lib/supabase/server";
import { IntegrationForm } from "@/components/admin/IntegrationForm";
import { WhatsAppIntegrationForm } from "@/components/admin/WhatsAppIntegrationForm";
import { IntegracoesTabs } from "@/components/admin/IntegracoesTabs";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

export default async function IntegracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: integrations } = await supabase
    .from("tenant_integrations")
    .select("*")
    .eq("tenant_id", membership!.tenant_id)
    .single();

  const limits = await getPlanLimits(createServiceClient(), membership!.tenant_id);
  const pixelsAllowed = featureAllowed(limits, "pixel_integrations");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Integrações & SEO</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Analytics, Pixels de anúncio, WhatsApp e conformidade com a LGPD.
        </p>
      </div>
      <IntegracoesTabs />
      <WhatsAppIntegrationForm
        tenantId={membership!.tenant_id}
        status={integrations?.whatsapp_status ?? "disconnected"}
        connectedAt={integrations?.whatsapp_connected_at ?? null}
      />
      <IntegrationForm
        tenantId={membership!.tenant_id}
        initialValues={integrations ?? {}}
        pixelsAllowed={pixelsAllowed}
      />
    </div>
  );
}
