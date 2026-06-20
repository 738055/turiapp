import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AutomationPresets } from "@/components/admin/AutomationPresets";
import { AutomationsList } from "@/components/admin/AutomationsList";
import { getPlanTier } from "@/lib/plans/limits";
import type { Automation } from "@/types";

export default async function AutomacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false });

  const items = (automations ?? []) as Automation[];
  const activeNames = items.map((a) => a.name);
  const planTier = await getPlanTier(createServiceClient(), membership!.tenant_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-gray-500 text-sm mt-1">
            Regras que disparam e-mails, notificações ou mudanças de status automaticamente.
          </p>
        </div>
        <Button asChild>
          <Link href="/automacoes/nova">
            <Plus className="h-4 w-4 mr-1" />
            Nova automação
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Modelos prontos</h2>
        <AutomationPresets tenantId={membership!.tenant_id} activePresetNames={activeNames} planTier={planTier} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Suas automações</h2>
        <AutomationsList automations={items} planTier={planTier} />
      </div>
    </div>
  );
}
