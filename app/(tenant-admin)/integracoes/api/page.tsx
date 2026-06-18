import { createClient } from "@/lib/supabase/server";
import { IntegracoesTabs } from "@/components/admin/IntegracoesTabs";
import { ApiKeysManager } from "@/components/admin/ApiKeysManager";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, tenant_id, name, key_prefix, scope, last_used_at, created_at, revoked_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Integrações & SEO</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gere chaves para autenticar integrações próprias com a API pública do TuriApp.
        </p>
      </div>
      <IntegracoesTabs />
      <ApiKeysManager tenantId={tenantId} keys={keys ?? []} />
    </div>
  );
}
