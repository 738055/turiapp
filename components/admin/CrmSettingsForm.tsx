"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import type { CrmSettings } from "@/lib/crm/segmentation";

interface CrmSettingsFormProps {
  tenantId: string;
  initialValues: CrmSettings;
}

export function CrmSettingsForm({ tenantId, initialValues }: CrmSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    tier_prata_min: String(initialValues.tier_prata_min),
    tier_ouro_min: String(initialValues.tier_ouro_min),
    tier_vip_min: String(initialValues.tier_vip_min),
    risk_days: String(initialValues.risk_days),
    lost_days: String(initialValues.lost_days),
    new_days: String(initialValues.new_days),
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/crm/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...form }),
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
          <CardTitle className="text-base">Faixas de valor gasto (tier)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            A partir de quanto em reais gastos (somando reservas confirmadas) o cliente sobe de faixa.
          </p>
          {field("Prata a partir de", "tier_prata_min", "R$")}
          {field("Ouro a partir de", "tier_ouro_min", "R$")}
          {field("VIP a partir de", "tier_vip_min", "R$")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segmentação por atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Define em quantos dias um cliente muda de segmento (Novo, Ativo, Recorrente, Em risco, Perdido).
          </p>
          {field("Considerar \"Novo\" até", "new_days", undefined, "dias após a 1ª reserva")}
          {field("Marcar \"Em risco\" após", "risk_days", undefined, "dias sem nova reserva")}
          {field("Marcar \"Perdido\" após", "lost_days", undefined, "dias sem nova reserva")}
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
