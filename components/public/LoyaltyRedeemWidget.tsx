"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LoyaltyRedeemWidgetProps {
  tenantId: string;
  bookingId: string;
  customerEmail: string;
  currency: string;
  primaryColor?: string;
}

interface MeResponse {
  balance: number;
  discountAvailable: number;
  minRedeemPoints: number;
}

export function LoyaltyRedeemWidget({ tenantId, bookingId, customerEmail, currency, primaryColor }: LoyaltyRedeemWidgetProps) {
  const router = useRouter();
  const color = primaryColor ?? "#0ea5e9";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "login" | "code" | "account">("loading");
  const [code, setCode] = useState("");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetch(`/api/loyalty/me?tenant_id=${tenantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setMe(data);
          setStep("account");
        } else {
          setStep("login");
        }
      })
      .catch(() => setStep("login"));
  }, [tenantId]);

  function requestCode() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/loyalty/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, email: customerEmail }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao enviar código.");
        return;
      }
      setStep("code");
    });
  }

  function verifyCode() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/loyalty/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, email: customerEmail, code }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Código inválido.");
        return;
      }
      const meRes = await fetch(`/api/loyalty/me?tenant_id=${tenantId}`);
      if (meRes.ok) {
        setMe(await meRes.json());
        setStep("account");
      }
    });
  }

  function redeem() {
    if (!me) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, booking_id: bookingId, points: me.balance }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao aplicar desconto.");
        return;
      }
      setApplied(true);
      router.refresh();
    });
  }

  if (step === "loading") return null;

  if (applied) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 flex items-center gap-2">
        <Gift className="h-4 w-4 flex-shrink-0" />
        Desconto de fidelidade aplicado com sucesso!
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Gift className="h-4 w-4" style={{ color }} />
        Pontos de fidelidade
      </div>

      {step === "login" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Já é cliente? Entre com {customerEmail} para usar seus pontos como desconto.
          </p>
          <Button size="sm" variant="outline" onClick={requestCode} disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar código de acesso"}
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Digite o código enviado para {customerEmail}:</p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="font-mono text-sm"
              placeholder="000000"
            />
            <Button size="sm" onClick={verifyCode} disabled={isPending || code.length !== 6} style={{ backgroundColor: color }}>
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {step === "account" && me && (
        <div className="space-y-2">
          {me.balance <= 0 || me.balance < me.minRedeemPoints ? (
            <p className="text-xs text-gray-500">
              Você tem {me.balance} pontos. Junte pelo menos {me.minRedeemPoints} pontos para usar como desconto.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Você tem <strong>{me.balance} pontos</strong> = {formatCurrency(me.discountAvailable, currency)} de desconto.
              </p>
              <Button size="sm" onClick={redeem} disabled={isPending} style={{ backgroundColor: color }}>
                {isPending ? "Aplicando..." : "Usar"}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
