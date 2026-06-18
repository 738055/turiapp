import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DomainManager } from "@/components/admin/DomainManager";
import { PlanLockCard } from "@/components/admin/PlanGate";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

export default async function DominioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(slug)")
    .eq("user_id", user!.id)
    .single();

  const tenantSlug = (membership?.tenants as unknown as { slug: string } | null)?.slug ?? "";
  const tenantId = membership?.tenant_id ?? "";

  const service = createServiceClient();

  const { data: domainRow } = await service
    .from("tenant_domains")
    .select("domain, verification_status, ssl_status, vercel_config")
    .eq("tenant_id", tenantId)
    .eq("type", "custom")
    .maybeSingle();

  const savedRecords =
    (domainRow?.vercel_config as { verification?: Array<{ type: string; domain: string; value: string; reason: string }> } | null)
      ?.verification ?? [];

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";

  const limits = await getPlanLimits(service, tenantId);
  const customDomainAllowed = featureAllowed(limits, "custom_domain");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Domínio próprio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure um domínio personalizado para o seu site
        </p>
      </div>

      {customDomainAllowed ? (
        <DomainManager
          currentDomain={domainRow ? { domain: domainRow.domain, verification_status: domainRow.verification_status, ssl_status: domainRow.ssl_status } : null}
          savedRecords={savedRecords}
          tenantSlug={tenantSlug}
          platformDomain={platformDomain}
        />
      ) : (
        <>
          <div className="rounded-lg bg-gray-50 border px-4 py-3 font-mono text-sm">
            Seu endereço atual: <span className="font-semibold">{tenantSlug}.{platformDomain}</span>
          </div>
          <PlanLockCard
            title="Domínio próprio"
            description="Usar seu próprio domínio (ex.: www.suaempresa.com.br) faz parte do plano Pro. Seu site continua no ar no endereço acima."
          />
        </>
      )}
    </div>
  );
}
