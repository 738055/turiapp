import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CrmSettingsForm } from "@/components/admin/CrmSettingsForm";
import { DEFAULT_CRM_SETTINGS } from "@/lib/crm/segmentation";
import { getPlanTier } from "@/lib/plans/limits";
import { proFeatureAllowed } from "@/lib/plans/pro-features";
import { ProFeatureGate } from "@/components/admin/ProFeatureGate";

export default async function CrmSettingsPage() {
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
        title="Segmentacao e pontuacao de clientes"
        description="No trial voce conhece a configuracao de CRM, mas ajustar faixas, segmentos e regras comerciais fica disponivel apenas nos planos Pro e Enterprise."
      />
    );
  }

  const { data: settings } = await service
    .from("crm_settings")
    .select("*")
    .eq("tenant_id", membership!.tenant_id)
    .maybeSingle();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pontuação e segmentação de clientes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Defina as faixas de valor e os prazos usados para classificar automaticamente seus
          clientes em /clientes. Cada loja tem seu próprio ticket médio — ajuste livremente.
        </p>
      </div>

      <CrmSettingsForm
        tenantId={membership!.tenant_id}
        initialValues={settings ?? DEFAULT_CRM_SETTINGS}
      />
    </div>
  );
}
