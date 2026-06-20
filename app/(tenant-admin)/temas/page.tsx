import { createClient } from "@/lib/supabase/server";
import { ThemeEditor } from "@/components/builder/ThemeEditor";

export default async function TemasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: theme } = await supabase
    .from("themes")
    .select("*")
    .eq("tenant_id", membership!.tenant_id)
    .single();

  const [{ data: tenant }, { data: homePage }, { data: customDomain }] = await Promise.all([
    supabase
      .from("tenants")
      .select("name, slug")
      .eq("id", membership!.tenant_id)
      .single(),
    supabase
      .from("pages")
      .select("template")
      .eq("tenant_id", membership!.tenant_id)
      .eq("is_home", true)
      .maybeSingle(),
    supabase
      .from("tenant_domains")
      .select("domain")
      .eq("tenant_id", membership!.tenant_id)
      .eq("type", "custom")
      .eq("verification_status", "verified")
      .eq("ssl_status", "issued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const platformHost = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";
  const storeHost = customDomain?.domain ?? (tenant?.slug ? `${tenant.slug}.${platformHost}` : null);
  const storeUrl = storeHost ? `https://${storeHost}` : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aparência</h1>
        <p className="text-gray-500 text-sm mt-1">
          Personalize as cores, fontes e layout da sua loja
        </p>
      </div>
      <ThemeEditor
        tenantId={membership!.tenant_id}
        initialTheme={theme}
        initialTemplate={homePage?.template ?? null}
        storeUrl={storeUrl}
      />
    </div>
  );
}
