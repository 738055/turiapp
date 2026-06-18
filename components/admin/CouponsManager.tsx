"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Ticket, Trash2 } from "lucide-react";
import type { Coupon } from "@/types";

export function CouponsManager({ tenantId, coupons }: { tenantId: string; coupons: Coupon[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "fixed", value: "", min_order: "", max_uses: "", expires_at: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/coupons/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        code: form.code,
        type: form.type,
        value: Number(form.value),
        min_order: form.min_order ? Number(form.min_order) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar cupom.");
      return;
    }
    setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
    router.refresh();
  }

  async function manage(coupon_id: string, action: "toggle" | "delete", active?: boolean) {
    if (action === "delete" && !window.confirm("Remover este cupom?")) return;
    const res = await fetch("/api/coupons/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, coupon_id, action, active }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-5 w-5 text-[var(--color-primary)]" /> Novo cupom
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-3">{error}</p>}
          <form onSubmit={create} className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VERAO20" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })} className="h-10 w-full rounded-[var(--radius)] border border-gray-200 bg-white px-3 text-sm">
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">{form.type === "percent" ? "Desconto (%)" : "Desconto (R$)"}</Label>
              <Input id="value" type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_order">Pedido mínimo (R$)</Label>
              <Input id="min_order" type="number" min="0" step="0.01" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_uses">Máx. de usos (opcional)</Label>
              <Input id="max_uses" type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Ilimitado" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expires_at">Expira em (opcional)</Label>
              <Input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Button type="submit" disabled={busy}>{busy ? "Criando..." : "Criar cupom"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus cupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {coupons.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhum cupom criado ainda.</p>}
          {coupons.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
            const exhausted = c.max_uses !== null && c.uses_count >= c.max_uses;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold text-gray-800">
                    {c.code}
                    {!c.active && <span className="ml-2 text-xs font-sans font-normal text-gray-400">(inativo)</span>}
                    {expired && <span className="ml-2 text-xs font-sans font-normal text-amber-600">(expirado)</span>}
                    {exhausted && <span className="ml-2 text-xs font-sans font-normal text-amber-600">(esgotado)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.type === "percent" ? `${c.value}% de desconto` : `${formatCurrency(c.value, "BRL")} de desconto`}
                    {c.min_order > 0 && ` · mín. ${formatCurrency(c.min_order, "BRL")}`}
                    {` · ${c.uses_count}${c.max_uses ? `/${c.max_uses}` : ""} usos`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => manage(c.id, "toggle", !c.active)}>
                    {c.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => manage(c.id, "delete")} title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
