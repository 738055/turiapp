import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Metric {
  label: string;
  value: string | number;
  sub?: string;
}

export default async function SuperAdminDashboard() {
  const service = createServiceClient();

  const [
    { count: totalTenants },
    { count: activeTenants },
    { data: subscriptions },
    { count: totalBookings },
  ] = await Promise.all([
    service.from("tenants").select("*", { count: "exact", head: true }),
    service
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    service
      .from("subscriptions")
      .select("current_period_price, currency")
      .eq("status", "active"),
    service.from("bookings").select("*", { count: "exact", head: true }),
  ]);

  // MRR: sum of active subscription prices
  const mrr = (subscriptions ?? []).reduce(
    (sum, s) => sum + (s.current_period_price ?? 0),
    0
  );

  const metrics: Metric[] = [
    { label: "Total de tenants", value: totalTenants ?? 0 },
    { label: "Tenants ativos", value: activeTenants ?? 0 },
    { label: "MRR", value: formatCurrency(mrr, "BRL"), sub: "Receita mensal recorrente" },
    { label: "Total de reservas", value: totalBookings ?? 0 },
  ];

  // Recent tenants
  const { data: recentTenants } = await service
    .from("tenants")
    .select("id, name, slug, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral da plataforma</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
              {m.sub && <p className="text-xs text-gray-500 mt-0.5">{m.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tenants */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-base text-white">Tenants recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 text-gray-400 font-medium">Nome</th>
                <th className="text-left py-2 text-gray-400 font-medium">Slug</th>
                <th className="text-left py-2 text-gray-400 font-medium">Status</th>
                <th className="text-left py-2 text-gray-400 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody>
              {recentTenants?.map((t) => (
                <tr key={t.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-2.5 text-white font-medium">{t.name}</td>
                  <td className="py-2.5 text-gray-400 font-mono text-xs">{t.slug}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        t.subscription_status === "active"
                          ? "bg-green-900 text-green-300"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {t.subscription_status ?? "trial"}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
