"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Rate {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface ProductOption {
  id: string;
  title: string;
  rates?: Rate[];
}

interface LeadOption {
  id: string;
  name: string;
  email: string;
}

interface QuoteFormProps {
  leads: LeadOption[];
  products: ProductOption[];
  defaultLeadId?: string;
  defaultProductId?: string;
}

export function QuoteForm({ leads, products, defaultLeadId, defaultProductId }: QuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [leadId, setLeadId] = useState(defaultLeadId ?? leads[0]?.id ?? "");
  const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? "");
  const [rateId, setRateId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(48);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          product_id: productId,
          rate_id: rateId || undefined,
          check_in: checkIn || undefined,
          check_out: checkOut || undefined,
          guests,
          total_price: Number(totalPrice),
          notes: notes || undefined,
          expires_in_hours: expiresInHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar cotação.");
        return;
      }
      router.push("/cotacoes");
    });
  }

  if (!leads.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Você ainda não tem leads ativos. Crie um lead primeiro em /leads.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border p-5">
      <div className="space-y-1.5">
        <Label className="text-sm">Lead</Label>
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="w-full rounded-[var(--radius,0.5rem)] border border-gray-200 px-3 py-2 text-sm"
        >
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.name} — {l.email}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Produto</Label>
        <select
          value={productId}
          onChange={(e) => { setProductId(e.target.value); setRateId(""); }}
          className="w-full rounded-[var(--radius,0.5rem)] border border-gray-200 px-3 py-2 text-sm"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {(selectedProduct?.rates?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm">Tarifa (opcional)</Label>
          <select
            value={rateId}
            onChange={(e) => {
              setRateId(e.target.value);
              const r = selectedProduct?.rates?.find((x) => x.id === e.target.value);
              if (r) setTotalPrice(String(r.price));
            }}
            className="w-full rounded-[var(--radius,0.5rem)] border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Personalizada</option>
            {selectedProduct?.rates?.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — R$ {r.price.toFixed(2).replace(".", ",")}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Check-in</Label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Check-out</Label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Pessoas</Label>
          <Input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor total (R$)</Label>
          <Input type="number" min={0} step="0.01" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Observações (aparecem na cotação)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Validade da proposta (horas)</Label>
        <Input type="number" min={1} max={720} value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))} className="h-9 text-sm w-32" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={submit} disabled={isPending || !leadId || !productId || !totalPrice}>
        {isPending ? "Criando..." : "Criar cotação"}
      </Button>
    </div>
  );
}
