"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

interface TenantSettingsFormProps {
  tenantId: string;
  initialName: string;
  initialLocale: string;
  tenantSlug: string;
}

export function TenantSettingsForm({ tenantId, initialName, initialLocale, tenantSlug }: TenantSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [locale, setLocale] = useState(initialLocale);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/tenants/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, name, locale }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Dados da empresa</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome da empresa</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome exibido na loja e nos e-mails"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Subdomínio</Label>
          <div className="flex items-center rounded-[var(--radius)] border overflow-hidden">
            <Input value={tenantSlug} disabled className="border-0 bg-gray-50 text-gray-400" />
            <span className="bg-gray-50 border-l px-3 py-2 text-sm text-gray-400">.turiapp.com.br</span>
          </div>
          <p className="text-xs text-gray-400">O subdomínio não pode ser alterado. Para domínio próprio, contate o suporte.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Idioma</Label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es">Español</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Configurações salvas com sucesso.</p>}

        <Button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
