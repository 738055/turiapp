import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AutomationForm } from "@/components/admin/AutomationForm";
import { getPlanTier } from "@/lib/plans/limits";
import type { Automation } from "@/types";

export default async function EditarAutomacaoPage({
  params,
}: {
  params: Promise<{ automationId: string }>;
}) {
  const { automationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: automation } = await supabase
    .from("automations")
    .select("*")
    .eq("id", automationId)
    .eq("tenant_id", membership!.tenant_id)
    .maybeSingle();

  if (!automation) notFound();
  const planTier = await getPlanTier(createServiceClient(), membership!.tenant_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar automação</h1>
        <p className="text-gray-500 text-sm mt-1">Ajuste o gatilho, a ação ou pause quando quiser.</p>
      </div>
      <AutomationForm tenantId={membership!.tenant_id} automation={automation as Automation} planTier={planTier} />
    </div>
  );
}
