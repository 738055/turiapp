"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, LogOut, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LoyaltyAccountProps {
  tenantId: string;
  primaryColor?: string;
}

interface LoyaltyHistoryEntry {
  id: string;
  points: number;
  type: "earn" | "redeem";
  description: string | null;
  created_at: string;
}

interface MeResponse {
  customer: { name: string; email: string };
  balance: number;
  discountAvailable: number;
  minRedeemPoints: number;
  history: LoyaltyHistoryEntry[];
}

export function LoyaltyAccount({ tenantId, primaryColor }: LoyaltyAccountProps) {
  const color = primaryColor ?? "#0ea5e9";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "login" | "code" | "account">("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [me, setMe] = useState<MeResponse | null>(null);

  function loadMe() {
    return fetch(`/api/loyalty/me?tenant_id=${tenantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => {
        if (data) {
          setMe(data);
          setStep("account");
        } else {
          setStep("login");
        }
      })
      .catch(() => setStep("login"));
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  function requestCode() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/loyalty/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, email }),
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
        body: JSON.stringify({ tenant_id: tenantId, email, code }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Código inválido.");
        return;
      }
      await loadMe();
    });
  }

  function logout() {
    startTransition(async () => {
      await fetch("/api/loyalty/logout", { method: "POST" });
      setMe(null);
      setCode("");
      setStep("login");
    });
  }

  if (step === "loading") {
    return <div className="text-center text-sm text-gray-400 py-10">Carregando...</div>;
  }

  if (step === "login") {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center space-y-1">
          <Gift className="h-8 w-8 mx-auto" style={{ color }} />
          <h1 className="text-lg font-bold">Minha conta de fidelidade</h1>
          <p className="text-sm text-gray-500">Informe seu e-mail para acessar seus pontos.</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button
          className="w-full"
          onClick={requestCode}
          disabled={isPending || !email}
          style={{ backgroundColor: color }}
        >
          {isPending ? "Enviando..." : "Enviar código de acesso"}
        </Button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold">Confirme seu código</h1>
          <p className="text-sm text-gray-500">Enviamos um código de 6 dígitos para {email}.</p>
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="text-center font-mono text-lg tracking-widest"
          placeholder="000000"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button
          className="w-full"
          onClick={verifyCode}
          disabled={isPending || code.length !== 6}
          style={{ backgroundColor: color }}
        >
          {isPending ? "Confirmando..." : "Entrar"}
        </Button>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border p-6 text-center space-y-2">
        <p className="text-sm text-gray-500">Olá, {me.customer.name}</p>
        <p className="text-4xl font-bold" style={{ color }}>{me.balance}</p>
        <p className="text-sm text-gray-500">pontos disponíveis</p>
        <p className="text-xs text-gray-400">
          Equivale a {formatCurrency(me.discountAvailable, "BRL")} em desconto
          {me.balance < me.minRedeemPoints && ` (mínimo de ${me.minRedeemPoints} pontos para usar)`}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-sm font-semibold mb-3">Extrato de pontos</h2>
        {me.history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Você ainda não tem movimentações.</p>
        ) : (
          <div className="space-y-2">
            {me.history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2 min-w-0">
                  {h.type === "earn" ? (
                    <ArrowUpCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate">{h.description ?? (h.type === "earn" ? "Pontos ganhos" : "Pontos usados")}</p>
                    <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <p className={`font-semibold flex-shrink-0 ${h.type === "earn" ? "text-green-600" : "text-orange-600"}`}>
                  {h.type === "earn" ? "+" : "-"}{h.points}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full" onClick={logout} disabled={isPending}>
        <LogOut className="h-4 w-4 mr-1" /> Sair
      </Button>
    </div>
  );
}
