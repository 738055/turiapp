"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Check } from "lucide-react";

interface CouponWidgetProps {
  tenantId: string;
  bookingId: string;
  currency: string;
  primaryColor: string;
  appliedCode?: string | null;
  appliedDiscount?: number;
}

export function CouponWidget({ tenantId, bookingId, currency, primaryColor, appliedCode, appliedDiscount }: CouponWidgetProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency ?? "BRL" }).format(v);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, booking_id: bookingId, code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Cupom inválido.");
      return;
    }
    router.refresh();
  }

  if (appliedCode) {
    return (
      <div className="rounded-2xl bg-white border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Check className="h-4 w-4" />
          Cupom <strong className="font-mono">{appliedCode}</strong> aplicado
          {appliedDiscount ? <span className="text-gray-500">· −{fmt(appliedDiscount)}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
        <Ticket className="h-4 w-4" style={{ color: primaryColor }} /> Tem um cupom de desconto?
      </div>
      <form onSubmit={apply} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Digite o código"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#0ea5e9)]"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {busy ? "..." : "Aplicar"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
