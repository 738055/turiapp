import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getMonthlyReportData, getRevenueTrend } from "@/lib/reports/data";
import { ReportsExporter } from "@/components/admin/ReportsExporter";
import { ReportsCharts } from "@/components/admin/ReportsCharts";
import { TrendingUp, Calendar, Users, Receipt } from "lucide-react";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;
  const month = new Date().toISOString().slice(0, 7);

  const [report, trend, { data: products }] = await Promise.all([
    getMonthlyReportData(tenantId, month),
    getRevenueTrend(tenantId, 6),
    supabase
      .from("products")
      .select("id, title")
      .eq("tenant_id", tenantId)
      .order("title", { ascending: true }),
  ]);

  const metrics = [
    {
      label: "Receita do mês",
      value: formatCurrency(report.revenue, report.currency),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Reservas confirmadas",
      value: report.bookingsCount,
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Novos clientes",
      value: report.newCustomers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(report.avgTicket, report.currency),
      icon: Receipt,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">
          Desempenho da sua loja e exportação de relatórios em PDF
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl p-3 flex-shrink-0 ${m.bg}`}>
                <m.icon className={`h-6 w-6 ${m.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                <p className="text-xl font-bold leading-tight truncate">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportsCharts
        trend={trend}
        topProducts={report.topProducts}
        currency={report.currency}
        primaryColor={report.primaryColor}
      />

      <ReportsExporter products={products ?? []} />
    </div>
  );
}
