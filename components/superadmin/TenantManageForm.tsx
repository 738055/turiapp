"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TenantDomain {
  id: string;
  domain: string;
  type: string;
  verification_status: string;
  ssl_status?: string;
}

interface TenantManageFormProps {
  tenant: Record<string, unknown>;
  domains: TenantDomain[];
}

export function TenantManageForm({ tenant, domains }: TenantManageFormProps) {
  const [isPending, startTransition] = useTransition();
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleStatusChange(status: "active" | "suspended") {
    startTransition(async () => {
      const res = await fetch("/api/admin/tenants/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, status }),
      });
      if (res.ok) setMessage(`Cliente ${status === "active" ? "ativado" : "suspenso"} com sucesso.`);
    });
  }

  function handleAddDomain() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/domains/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, domain: newDomain }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao adicionar domínio.");
        return;
      }
      setNewDomain("");
      setMessage("Domínio adicionado. Configure os DNS indicados.");
      window.location.reload();
    });
  }

  function handleRemoveDomain(domainId: string) {
    startTransition(async () => {
      await fetch("/api/admin/domains/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_id: domainId }),
      });
      window.location.reload();
    });
  }

  const plan = tenant.plans as { name: string; price_monthly: number } | null;

  return (
    <div className="space-y-5">
      {/* Info card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-base text-white">Informações</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Plano</span>
            <span className="text-white">{plan?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status da conta</span>
            <Badge variant={tenant.status === "active" ? "success" : "secondary"}>
              {tenant.status as string}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status da assinatura</span>
            <Badge variant={tenant.subscription_status === "active" ? "success" : "secondary"}>
              {(tenant.subscription_status as string) ?? "trial"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Criado em</span>
            <span className="text-gray-300">
              {new Date(tenant.created_at as string).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Status actions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-base text-white">Ações</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleStatusChange("active")}
            disabled={isPending || tenant.status === "active"}
            className="bg-green-700 hover:bg-green-600 text-white"
          >
            Ativar cliente
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("suspended")}
            disabled={isPending || tenant.status === "suspended"}
            className="border-red-800 text-red-400 hover:bg-red-900"
          >
            Suspender cliente
          </Button>
        </CardContent>
      </Card>

      {/* Domains */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-base text-white">Domínios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2.5">
              <div>
                <p className="text-sm text-white font-mono">{d.domain}</p>
                <div className="flex gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{d.type}</Badge>
                  <Badge
                    variant={d.verification_status === "verified" ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {d.verification_status}
                  </Badge>
                  {d.ssl_status && (
                    <Badge
                      variant={d.ssl_status === "issued" ? "success" : "secondary"}
                      className="text-xs"
                    >
                      SSL: {d.ssl_status}
                    </Badge>
                  )}
                </div>
              </div>
              {d.type === "custom" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveDomain(d.id)}
                  disabled={isPending}
                  className="border-red-800 text-red-400 hover:bg-red-900 text-xs"
                >
                  Remover
                </Button>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-gray-400">Adicionar domínio personalizado</Label>
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="www.exemplo.com.br"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleAddDomain}
              disabled={isPending || !newDomain}
              className="self-end bg-sky-700 hover:bg-sky-600"
            >
              Adicionar
            </Button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {message && (
        <div className="rounded border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
          {message}
        </div>
      )}
    </div>
  );
}
