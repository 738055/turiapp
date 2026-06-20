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

  const { data: theme } = await supabase
    .from("themes")
    .select("*")
    .eq("tenant_id", membership!.tenant_id)
    .single();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", membership!.tenant_id)
    .single();

  const platformHost = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";
  const previewUrl = tenant?.slug ? `https://${tenant.slug}.${platformHost}` : null;

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
