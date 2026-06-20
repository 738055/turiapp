export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function AssinaturasPage() {
  const service = createServiceClient();

  const { data: subscriptions } = await service
    .from("subscriptions")
    .select("*, tenants(name, slug), plans(name, price_monthly)")
    .order("created_at", { ascending: false });

  const mrr = (subscriptions ?? [])
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.current_period_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
          <p className="text-gray-400 text-sm mt-1">{subscriptions?.length ?? 0} assinaturas</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider">MRR</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(mrr, "BRL")}</p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Cliente</th>
                <th className="text-left p-4 text-gray-400 font-medium">Plano</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                <th className="text-left p-4 text-gray-400 font-medium">Próx. renovação</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions?.map((s) => {
                const tenant = s.tenants as unknown as { name: string; slug: string } | null;
                const plan = s.plans as unknown as { name: string; price_monthly: number } | null;
                return (
                  <tr key={s.id} className="border-b border-gray-800 last:border-0">
                    <td className="p-4">
                      <p className="text-white font-medium">{tenant?.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{tenant?.slug}</p>
                    </td>
                    <td className="p-4 text-gray-300">{plan?.name}</td>
                    <td className="p-4">
                      <Badge variant={s.status === "active" ? "success" : "secondary"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-green-400 font-medium">
                      {formatCurrency(s.current_period_price ?? plan?.price_monthly ?? 0, "BRL")}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
