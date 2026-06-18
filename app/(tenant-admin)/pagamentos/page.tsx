import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PaymentAccountForm } from "@/components/admin/PaymentAccountForm";
import { PlanLockCard } from "@/components/admin/PlanGate";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

export default async function PagamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user!.id)
    .single();

  const limits = await getPlanLimits(createServiceClient(), membership!.tenant_id);
  const paymentsAllowed = featureAllowed(limits, "booking_engine");

  const { data: accounts } = await supabase
    .from("tenant_payment_accounts")
    .select("provider, status, connected_at")
    .eq("tenant_id", membership!.tenant_id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Formas de pagamento</h1>
        <p className="text-gray-500 text-sm mt-1">
          Conecte sua conta Stripe ou Mercado Pago para receber pagamentos direto na sua conta.
          A plataforma nunca cobra comissão sobre as vendas.
        </p>
      </div>

      {!paymentsAllowed ? (
        <PlanLockCard
          title="Pagamentos online"
          description="Receber pagamentos pelo site (Stripe, Mercado Pago, PIX) faz parte do plano Pro. No seu plano atual, os produtos vendem via WhatsApp."
        />
      ) : (
        <>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Como funciona:</strong> os pagamentos dos seus clientes vão direto para a sua conta
            Stripe ou Mercado Pago. A plataforma não intermedia o dinheiro das suas vendas.
          </div>

          <PaymentAccountForm
            tenantId={membership!.tenant_id}
            accounts={(accounts ?? []) as { provider: "stripe" | "mercadopago"; status: string; connected_at?: string }[]}
          />
        </>
      )}
    </div>
  );
}
