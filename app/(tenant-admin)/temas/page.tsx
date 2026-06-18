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

  const { data: integrations } = await supabase
    .from("tenant_integrations")
    .select("whatsapp_number")
    .eq("tenant_id", membership!.tenant_id)
    .single();

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
        whatsappNumber={integrations?.whatsapp_number ?? null}
      />
    </div>
  );
}
