export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PlanEditor } from "@/components/superadmin/PlanEditor";

export default async function PlanosPage() {
  const service = createServiceClient();

  const { data: plans } = await service
    .from("plans")
    .select("*")
    .order("price_monthly", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Planos da plataforma</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure os planos Básico, Pro e Enterprise oferecidos aos clientes.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans?.map((plan) => {
          const limits = plan.limits as Record<string, unknown>;
          return (
            <Card key={plan.id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(plan.price_monthly, "BRL")}
                  <span className="text-sm font-normal text-gray-400">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-gray-400">
                {Object.entries(limits ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k.replace(/_/g, " ")}</span>
                    <span className="text-white">{String(v === -1 ? "ilimitado" : v)}</span>
                  </div>
                ))}
                {plan.stripe_price_id_monthly && (
                  <p className="font-mono mt-2 text-gray-600 truncate">{plan.stripe_price_id_monthly}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor */}
      <PlanEditor plans={plans ?? []} />
    </div>
  );
}
