import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/builder/PageBuilder";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: page } = await supabase
    .from("pages")
    .select("*, sections:page_sections(*)")
    .eq("id", pageId)
    .eq("tenant_id", membership!.tenant_id)
    .single();

  if (!page) notFound();

  const [{ data: theme }, { data: tenant }, { data: customDomain }] = await Promise.all([
    supabase
      .from("themes")
      .select("*")
      .eq("tenant_id", membership!.tenant_id)
      .single(),
    supabase
      .from("tenants")
      .select("slug")
      .eq("id", membership!.tenant_id)
      .single(),
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
  const previewHost = customDomain?.domain ?? (tenant?.slug ? `${tenant.slug}.${platformHost}` : null);
  const previewUrl = previewHost ? `https://${previewHost}` : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar página: {page.title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Adicione e configure seções da sua página
        </p>
      </div>
      <PageBuilder page={page} theme={theme} tenantId={membership!.tenant_id} previewUrl={previewUrl} />
    </div>
  );
}
