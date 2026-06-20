"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ChevronDown, ChevronUp } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  limits: Record<string, unknown>;
}

export function PlanEditor({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Clique em um plano para editar seus detalhes:</p>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isOpen={open === plan.id}
          onToggle={() => setOpen(open === plan.id ? null : plan.id)}
        />
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  isOpen,
  onToggle,
}: {
  plan: Plan;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(plan.name);
  const [priceMonthly, setPriceMonthly] = useState(String(plan.price_monthly));
  const [priceYearly, setPriceYearly] = useState(String(plan.price_yearly));
  const [stripePriceIdMonthly, setStripePriceIdMonthly] = useState(plan.stripe_price_id_monthly ?? "");
  const [stripePriceIdYearly, setStripePriceIdYearly] = useState(plan.stripe_price_id_yearly ?? "");
  const [limitsJson, setLimitsJson] = useState(JSON.stringify(plan.limits, null, 2));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setMessage(null);

    let limits: Record<string, unknown>;
    try {
      limits = JSON.parse(limitsJson);
    } catch {
      setError("JSON de limites inválido.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/planos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          name,
          price_monthly: parseFloat(priceMonthly),
          price_yearly: parseFloat(priceYearly),
          stripe_price_id_monthly: stripePriceIdMonthly || null,
          stripe_price_id_yearly: stripePriceIdYearly || null,
          limits,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setMessage("Plano salvo com sucesso.");
    });
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-semibold text-white">{plan.name}</p>
          <p className="text-sm text-gray-400">R$ {plan.price_monthly}/mês</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <CardContent className="border-t border-gray-800 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Preço mensal (BRL)</Label>
              <Input
                type="number"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Preço anual (BRL)</Label>
              <Input
                type="number"
                value={priceYearly}
                onChange={(e) => setPriceYearly(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Stripe Price ID mensal</Label>
              <Input
                value={stripePriceIdMonthly}
                onChange={(e) => setStripePriceIdMonthly(e.target.value)}
                placeholder="price_..."
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Stripe Price ID anual</Label>
              <Input
                value={stripePriceIdYearly}
                onChange={(e) => setStripePriceIdYearly(e.target.value)}
                placeholder="price_..."
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Limites (JSON)</Label>
            <textarea
              value={limitsJson}
              onChange={(e) => setLimitsJson(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-mono text-white resize-none h-32"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-sky-700 hover:bg-sky-600 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            {isPending ? "Salvando..." : "Salvar plano"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
