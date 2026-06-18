import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Check, Star } from "lucide-react";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; changed?: string; cancelled?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const notice =
    sp.subscribed === "1"
      ? { kind: "ok" as const, text: "Assinatura ativada! Pode levar alguns instantes para refletir aqui." }
      : sp.changed === "1"
      ? { kind: "ok" as const, text: "Plano alterado. O valor é ajustado proporcionalmente na próxima fatura." }
      : sp.cancelled === "1"
      ? { kind: "warn" as const, text: "Checkout cancelado. Nenhuma cobrança foi feita." }
      : sp.error
      ? { kind: "err" as const, text: "Algo deu errado. Tente novamente ou fale com o suporte." }
      : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name, subscription_status, stripe_customer_id, trial_ends_at)")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership?.tenant_id;
  const tenant = membership?.tenants as unknown as {
    name: string;
    subscription_status: string | null;
    stripe_customer_id: string | null;
    trial_ends_at: string | null;
  } | null;

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("price_monthly");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId!)
    .single();

  const isTrialing = tenant?.subscription_status === "trialing" || !tenant?.subscription_status;
  const trialEnd = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie seu plano na plataforma TuriApp</p>
      </div>

      {notice && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            notice.kind === "ok"
              ? "bg-green-50 text-green-700"
              : notice.kind === "warn"
              ? "bg-amber-50 text-amber-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Status atual */}
      {isTrialing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-600" />
            <p className="font-semibold text-amber-800">Período de teste</p>
          </div>
          <p className="text-sm text-amber-700">
            {trialDaysLeft > 0
              ? `Você tem ${trialDaysLeft} dia${trialDaysLeft !== 1 ? "s" : ""} restantes no período gratuito.`
              : "Seu período de teste encerrou. Escolha um plano para continuar."}
          </p>
        </div>
      )}

      {subscription && !isTrialing && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">
            Plano {subscription.status === "active" ? "ativo" : subscription.status}
          </p>
          <p className="text-sm text-green-700 mt-1">
            Próxima renovação:{" "}
            {subscription.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
              : "—"}
          </p>
          {tenant?.stripe_customer_id && (
            <form action="/api/stripe/portal" method="POST" className="mt-3">
              <Button type="submit" variant="outline" size="sm">
                Gerenciar pagamento
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans?.map((plan, i) => {
          const limits = plan.limits as Record<string, unknown>;
          const features = plan.features as string[];
          const isPopular = i === 1;

          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? "border-sky-500 border-2 shadow-lg" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-sky-500 text-white text-xs px-3">Mais popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {formatCurrency(plan.price_monthly, "BRL")}
                  </span>
                  <span className="text-gray-400 text-sm">/mês</span>
                </div>
                <p className="text-xs text-gray-400">
                  ou {formatCurrency(plan.price_yearly / 12, "BRL")}/mês no plano anual
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {features?.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <form action="/api/stripe/checkout" method="POST">
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <input type="hidden" name="price_id" value={plan.stripe_price_id_monthly ?? ""} />
                  <Button
                    type="submit"
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    style={isPopular ? { backgroundColor: "#0ea5e9" } : {}}
                  >
                    Assinar {plan.name}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
