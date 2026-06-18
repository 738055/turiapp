"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import type { LoyaltyConfig } from "@/lib/loyalty/settings";

interface LoyaltySettingsFormProps {
  tenantId: string;
  initialValues: LoyaltyConfig;
}

export function LoyaltySettingsForm({ tenantId, initialValues }: LoyaltySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [active, setActive] = useState(initialValues.active);
  const [earnMode, setEarnMode] = useState(initialValues.earn_mode);
  const [form, setForm] = useState({
    points_per_amount: String(initialValues.points_per_amount),
    points_per_booking: String(initialValues.points_per_booking),
    redeem_value_per_point: String(initialValues.redeem_value_per_point),
    min_redeem_points: String(initialValues.min_redeem_points),
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/loyalty/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, active, earn_mode: earnMode, ...form }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
    });
  }

  const field = (label: string, key: keyof typeof form, prefix?: string, suffix?: string) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-gray-400">{prefix}</span>}
        <Input
          type="number"
          min={0}
          step="0.01"
          value={form[key]}
          onChange={(e) => update(key, e.target.value)}
          className="font-mono text-sm"
        />
        {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programa de fidelidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="loyalty-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="loyalty-active" className="text-sm font-normal cursor-pointer">
              Ativar programa de fidelidade na minha loja
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Como o cliente ganha pontos</Label>
            <select
              value={earnMode}
              onChange={(e) => setEarnMode(e.target.value as "per_amount" | "per_booking")}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="per_amount">Pontos por valor gasto</option>
              <option value="per_booking">Pontos fixos por reserva confirmada</option>
            </select>
          </div>

          {earnMode === "per_amount"
            ? field("Pontos por R$1 gasto", "points_per_amount")
            : field("Pontos por reserva confirmada", "points_per_booking")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resgate de pontos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Define quanto cada ponto vale em desconto e o mínimo de pontos para resgatar no checkout.
          </p>
          {field("Valor de cada ponto", "redeem_value_per_point", "R$")}
          {field("Mínimo de pontos para resgate", "min_redeem_points")}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Configurações salvas com sucesso.
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
