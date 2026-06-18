"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, QrCode } from "lucide-react";

interface Props {
  orderId: string;
  tenantId: string;
  hasStripe: boolean;
  hasMp: boolean;
  primaryColor: string;
  cancelled?: boolean;
}

export function OrderCheckoutWidget({ orderId, tenantId, hasStripe, hasMp, primaryColor, cancelled }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<"stripe" | "mercadopago" | null>(null);

  function pay(provider: "stripe" | "mercadopago") {
    setError(null);
    setActive(provider);
    startTransition(async () => {
      const endpoint = provider === "stripe" ? "/api/checkout/order/stripe" : "/api/checkout/order/mercadopago";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, tenant_id: tenantId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao iniciar pagamento.");
        setActive(null);
        return;
      }
      window.location.href = data.url;
    });
  }

  if (!hasStripe && !hasMp) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center text-sm text-yellow-800">
        Pedido recebido! Entraremos em contato para combinar o pagamento.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cancelled && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
          Pagamento cancelado. Você pode tentar novamente.
        </div>
      )}
      {hasMp && (
        <Button className="w-full h-12 text-sm font-semibold" onClick={() => pay("mercadopago")} disabled={isPending} style={{ backgroundColor: "#009ee3" }}>
          {isPending && active === "mercadopago" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aguarde...</> : <><QrCode className="h-4 w-4 mr-2" /> PIX, cartão até 12x ou boleto</>}
        </Button>
      )}
      {hasStripe && (
        <Button className="w-full h-12 text-sm font-semibold" onClick={() => pay("stripe")} disabled={isPending} style={{ backgroundColor: "#635bff" }}>
          {isPending && active === "stripe" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aguarde...</> : <><CreditCard className="h-4 w-4 mr-2" /> Pagar com cartão (Stripe)</>}
        </Button>
      )}
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
