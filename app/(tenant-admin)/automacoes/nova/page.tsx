import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AutomationForm } from "@/components/admin/AutomationForm";
import { getPlanTier } from "@/lib/plans/limits";

export default async function NovaAutomacaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();
  const planTier = await getPlanTier(createServiceClient(), membership!.tenant_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova automação</h1>
        <p className="text-gray-500 text-sm mt-1">Configure o gatilho e a ação. Tudo fica salvo só para sua loja.</p>
      </div>
      <AutomationForm tenantId={membership!.tenant_id} planTier={planTier} />
    </div>
  );
}
