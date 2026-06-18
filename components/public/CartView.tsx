"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingCart } from "lucide-react";
import { getCart, removeItem, clearCart, CART_EVENT, type CartItem } from "@/lib/cart/store";

export function CartView({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const total = items.reduce((s, i) => s + i.total, 0);
  const fmt = (v: number, c = "BRL") => new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          rate_id: i.rate_id,
          checkin: i.checkin,
          checkout: i.checkout,
          guests: i.guests,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Erro ao finalizar o pedido.");
      setBusy(false);
      return;
    }
    clearCart();
    window.location.href = `/checkout/pedido/${data.orderId}`;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white border p-10 text-center">
        <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Seu carrinho está vazio.</p>
        <Link href="/" className="text-sm font-medium mt-3 inline-block" style={{ color: "var(--color-primary)" }}>
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-2xl bg-white border p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.image ? (
              <img src={i.image} alt={i.title} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🏖️</div>
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/produto/${i.slug}`} className="font-medium text-gray-900 hover:underline">{i.title}</Link>
              <p className="text-xs text-gray-400">
                {i.rate_name}
                {i.checkin ? ` · ${new Date(i.checkin + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                {i.guests ? ` · ${i.guests} ${i.guests === 1 ? "pessoa" : "pessoas"}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold" style={{ color: "var(--color-primary)" }}>{fmt(i.total, i.currency)}</p>
              <button onClick={() => removeItem(i.id)} className="text-xs text-gray-400 hover:text-red-600 inline-flex items-center gap-1 mt-1">
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border p-5 flex items-center justify-between">
        <span className="text-gray-500">Total</span>
        <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{fmt(total)}</span>
      </div>

      <form onSubmit={checkout} className="rounded-2xl bg-white border p-5 space-y-3">
        <p className="font-medium text-gray-700">Seus dados</p>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone / WhatsApp" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg py-3 text-white font-semibold disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
          {busy ? "Processando..." : "Ir para o pagamento"}
        </button>
      </form>
    </div>
  );
}
