import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default async function TenantDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name, status, subscription_status)")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership?.tenant_id;
  const tenantStatus = (membership?.tenants as unknown as { subscription_status: string | null } | null)
    ?.subscription_status;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Metrics
  const [
    { count: totalProducts },
    { count: totalBookings },
    { count: totalCustomers },
    { data: recentBookings },
    { data: monthlyBookings },
    { count: totalPendingConfirmed },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .eq("status", "published"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId!),
    supabase
      .from("bookings")
      .select("id, total_price, currency, status, created_at, products(title)")
      .eq("tenant_id", tenantId!)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select("total_price, currency, status")
      .eq("tenant_id", tenantId!)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .in("status", ["pending", "confirmed", "completed"]),
  ]);

  const confirmedThisMonth = (monthlyBookings ?? []).filter((b) =>
    ["confirmed", "completed"].includes(b.status)
  );
  const revenueThisMonth = confirmedThisMonth.reduce(
    (sum, b) => sum + (b.total_price as number ?? 0),
    0
  );
  const primaryCurrency = confirmedThisMonth[0]?.currency ?? "BRL";
  const ticketMedio =
    confirmedThisMonth.length > 0 ? revenueThisMonth / confirmedThisMonth.length : 0;
  const conversionRate =
    totalPendingConfirmed && totalPendingConfirmed > 0
      ? Math.round(((totalBookings ?? 0) / totalPendingConfirmed) * 100)
      : 0;

  const fmt = (v: number, currency = "BRL") =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);

  const metrics = [
    {
      title: "Receita este mês",
      value: fmt(revenueThisMonth, primaryCurrency),
      sub: `Ticket médio: ${fmt(ticketMedio, primaryCurrency)}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Reservas confirmadas",
      value: totalBookings ?? 0,
      sub: `Taxa de confirmação: ${conversionRate}%`,
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Produtos publicados",
      value: totalProducts ?? 0,
      sub: `${totalCustomers ?? 0} clientes cadastrados`,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Visão geral da sua loja
        </p>
      </div>

      {/* Subscription alert */}
      {tenantStatus !== "active" && tenantStatus !== "trialing" && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Sua assinatura está{" "}
            <strong>{tenantStatus ?? "inativa"}</strong>. Acesse{" "}
            <a href="/configuracoes/assinatura" className="underline font-medium">
              Configurações &gt; Assinatura
            </a>{" "}
            para reativar.
          </p>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl p-3 flex-shrink-0 ${m.bg}`}>
                <m.icon className={`h-6 w-6 ${m.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{m.title}</p>
                <p className="text-xl font-bold leading-tight truncate">{m.value}</p>
                {m.sub && <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reservas recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentBookings?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma reserva ainda. Cadastre produtos e compartilhe sua loja!
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {(b.products as unknown as { title: string } | null)?.title ?? "Produto"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.created_at as string).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {formatCurrency(b.total_price as number, b.currency as string)}
                    </span>
                    <Badge
                      variant={
                        b.status === "confirmed" || b.status === "completed"
                          ? "success"
                          : b.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {b.status === "confirmed"
                        ? "Confirmada"
                        : b.status === "completed"
                        ? "Concluída"
                        : b.status === "pending"
                        ? "Pendente"
                        : "Cancelada"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup checklist */}
      <SetupChecklist tenantId={tenantId!} />
    </div>
  );
}

async function SetupChecklist({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();

  const [
    { count: products },
    { data: theme },
    { data: paymentAccount },
    { data: integrations },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase.from("themes").select("logo_url").eq("tenant_id", tenantId).single(),
    supabase
      .from("tenant_payment_accounts")
      .select("status")
      .eq("tenant_id", tenantId)
      .eq("status", "connected")
      .limit(1)
      .single(),
    supabase
      .from("tenant_integrations")
      .select("whatsapp_number")
      .eq("tenant_id", tenantId)
      .single(),
  ]);

  const steps = [
    {
      label: "Adicionar logo da empresa",
      done: !!theme?.logo_url,
      href: "/temas",
    },
    {
      label: "Cadastrar primeiro produto",
      done: (products ?? 0) > 0,
      href: "/produtos/novo",
    },
    {
      label: "Configurar pagamento ou WhatsApp",
      done: !!paymentAccount || !!integrations?.whatsapp_number,
      href: "/pagamentos",
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  return (
    <Card className="border-blue-100 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-base text-blue-900">
          Configure sua loja — passos iniciais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <a
            key={step.label}
            href={step.done ? "#" : step.href}
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
              step.done
                ? "bg-white/60 text-gray-400 cursor-default"
                : "bg-white hover:bg-blue-50 text-gray-700 cursor-pointer"
            }`}
          >
            <CheckCircle2
              className={`h-5 w-5 flex-shrink-0 ${
                step.done ? "text-green-500" : "text-gray-300"
              }`}
            />
            <span className={`text-sm ${step.done ? "line-through" : "font-medium"}`}>
              {step.label}
            </span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
