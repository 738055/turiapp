"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, QrCode } from "lucide-react";

interface CheckoutWidgetProps {
  bookingId: string;
  tenantId: string;
  totalPrice: number;
  currency: string;
  hasStripe: boolean;
  hasMp: boolean;
  primaryColor: string;
  cancelled?: boolean;
}

interface PixData {
  qr_code: string;
  qr_code_base64: string;
  expiration?: string | null;
}

export function CheckoutWidget({
  bookingId,
  tenantId,
  totalPrice,
  currency,
  hasStripe,
  hasMp,
  primaryColor,
  cancelled,
}: CheckoutWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"stripe" | "mercadopago" | "pix" | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const total = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency ?? "BRL",
  }).format(totalPrice);

  function pay(provider: "stripe" | "mercadopago") {
    setError(null);
    setActiveProvider(provider);
    startTransition(async () => {
      const endpoint = provider === "stripe" ? "/api/checkout/stripe" : "/api/checkout/mercadopago";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, tenant_id: tenantId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao iniciar pagamento. Tente novamente.");
        setActiveProvider(null);
        return;
      }
      window.location.href = data.url;
    });
  }

  function payPix() {
    setError(null);
    setActiveProvider("pix");
    startTransition(async () => {
      const res = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, tenant_id: tenantId }),
      });
      const data = await res.json();
      if (!res.ok || !data.qr_code) {
        setError(data.error ?? "Não foi possível gerar o PIX. Tente outro método.");
        setActiveProvider(null);
        return;
      }
      setPix({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64, expiration: data.expiration });
    });
  }

  function copyPix() {
    if (!pix) return;
    navigator.clipboard.writeText(pix.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Poll the booking status while a PIX is pending; confirmation is processed by
  // the Mercado Pago webhook, so we just watch for status === "confirmed".
  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/checkout/pix/status?booking_id=${bookingId}&tenant_id=${tenantId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "confirmed") {
      setConfirmed(true);
      window.location.href = `/checkout/sucesso?bookingId=${bookingId}`;
    }
  }, [bookingId, tenantId]);

  useEffect(() => {
    if (!pix || confirmed) return;
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [pix, confirmed, checkStatus]);

  if (!hasStripe && !hasMp) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center space-y-2">
        <p className="text-sm text-yellow-800 font-medium">Sua reserva foi recebida!</p>
        <p className="text-xs text-yellow-700">Entraremos em contato para confirmar e combinar o pagamento.</p>
        <p className="text-xs text-gray-400 mt-2">Código: {bookingId.slice(0, 8).toUpperCase()}</p>
      </div>
    );
  }

  // PIX panel (QR code + copy-paste + live status)
  if (pix) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700">
          <QrCode className="h-4 w-4" /> Pague com PIX
        </div>
        {pix.qr_code_base64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${pix.qr_code_base64}`}
            alt="QR Code PIX"
            className="mx-auto h-56 w-56 rounded-lg border bg-white p-2"
          />
        ) : null}
        <p className="text-xs text-gray-500">Abra o app do seu banco, escolha PIX e escaneie o QR code — ou copie o código abaixo.</p>
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={pix.qr_code}
            className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button variant="outline" size="sm" onClick={copyPix} type="button">
            {copied ? <><Check className="h-3.5 w-3.5 mr-1" /> Copiado</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</>}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Aguardando confirmação do pagamento...
        </div>
        <p className="text-xs text-gray-400">O QR code expira em ~30 minutos. A tela atualiza sozinha quando o pagamento cair.</p>
        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cancelled && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
          Pagamento cancelado. Você pode tentar novamente abaixo.
        </div>
      )}

      <div className="rounded-lg bg-gray-50 px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Total a pagar</span>
        <span className="text-xl font-bold" style={{ color: primaryColor }}>{total}</span>
      </div>

      <p className="text-sm font-medium text-gray-700">Escolha a forma de pagamento:</p>

      <div className="space-y-3">
        {hasMp && (
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={payPix}
            disabled={isPending}
            style={{ backgroundColor: "#32BCAD" }}
          >
            {isPending && activeProvider === "pix" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando PIX...</>
            ) : (
              <><QrCode className="h-4 w-4 mr-2" /> Pagar com PIX</>
            )}
          </Button>
        )}

        {hasStripe && (
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={() => pay("stripe")}
            disabled={isPending}
            style={{ backgroundColor: "#635bff" }}
          >
            {isPending && activeProvider === "stripe" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aguarde...</>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm5.47 18.62c0 2.85-2.39 4.31-5.84 4.31-2.06 0-4.04-.52-5.64-1.45v-3.5c1.69 1.05 3.82 1.8 5.64 1.8 1.18 0 1.97-.33 1.97-1.1 0-.8-.77-1.2-2.77-1.83-2.65-.86-4.36-2.01-4.36-4.28 0-2.79 2.28-4.22 5.57-4.22 1.83 0 3.59.44 5.02 1.2v3.46c-1.5-.87-3.38-1.47-5.02-1.47-1.1 0-1.82.32-1.82 1.01 0 .73.74 1.07 2.84 1.73 2.67.87 4.41 2.07 4.41 4.34z" />
                </svg>
                Pagar com cartão (Stripe)
              </>
            )}
          </Button>
        )}

        {hasMp && (
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={() => pay("mercadopago")}
            disabled={isPending}
            style={{ backgroundColor: "#009ee3" }}
          >
            {isPending && activeProvider === "mercadopago" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aguarde...</>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm6.12 16.86c-.26 2.18-1.7 4.04-3.64 5.12-.16.09-.34.13-.52.13-.18 0-.35-.05-.5-.14a1.01 1.01 0 01-.5-.87v-2.84c0-.38.22-.73.56-.9 1.07-.52 1.82-1.61 1.82-2.86 0-1.78-1.44-3.22-3.22-3.22-1.78 0-3.22 1.44-3.22 3.22 0 1.25.75 2.34 1.82 2.86.34.17.56.52.56.9v2.84c0 .37-.19.71-.5.87-.15.09-.32.14-.5.14-.18 0-.36-.04-.52-.13-1.94-1.08-3.38-2.94-3.64-5.12-.04-.36-.07-.72-.07-1.09 0-4.53 3.69-8.22 8.22-8.22 4.53 0 8.22 3.69 8.22 8.22 0 .37-.02.73-.07 1.09z" />
                </svg>
                Cartão em até 12x ou boleto
              </>
            )}
          </Button>
        )}
      </div>
      {hasMp && (
        <p className="text-xs text-gray-400 text-center">
          Parcele em até 12x no cartão ou pague no boleto pelo Mercado Pago.
        </p>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Código da reserva: {bookingId.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}
