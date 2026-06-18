"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ApiKey } from "@/types";

interface ApiKeysManagerProps {
  tenantId: string;
  keys: ApiKey[];
}

export function ApiKeysManager({ tenantId, keys }: ApiKeysManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"full" | "read_only">("full");
  const [error, setError] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    if (!name) {
      setError("Dê um nome para identificar esta chave.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/integrations/api-keys/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, name, scope }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Erro ao criar chave.");
        return;
      }
      setRevealedKey(result.key);
      setName("");
      window.location.reload();
    });
  }

  function handleRevoke(keyId: string) {
    if (!confirm("Revogar esta chave? Qualquer integração que a use deixará de funcionar imediatamente.")) return;
    startTransition(async () => {
      await fetch("/api/integrations/api-keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: keyId, tenant_id: tenantId }),
      });
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      {revealedKey && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-amber-900">
              Copie esta chave agora — ela não será exibida novamente:
            </p>
            <code className="block mt-2 p-2 bg-white border rounded text-sm break-all">{revealedKey}</code>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setRevealedKey(null)}>
              Já copiei
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chaves de API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Nome da chave</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Integração Zapier"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Permissão</Label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "full" | "read_only")}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm h-9"
              >
                <option value="full">Leitura e escrita</option>
                <option value="read_only">Somente leitura</option>
              </select>
            </div>
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar chave"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {keys.length === 0 && <p className="text-sm text-gray-400">Nenhuma chave gerada ainda.</p>}

          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{key.name}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {key.scope === "read_only" ? "Somente leitura" : "Leitura e escrita"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-mono">{key.key_prefix}••••••••</p>
                <p className="text-xs text-gray-400">
                  {key.last_used_at
                    ? `Último uso: ${new Date(key.last_used_at).toLocaleString("pt-BR")}`
                    : "Nunca utilizada"}
                </p>
              </div>
              {key.revoked_at ? (
                <Badge variant="secondary">Revogada</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(key.id)}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Revogar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            Autentique suas requisições com o header{" "}
            <code className="bg-gray-100 px-1 rounded">Authorization: Bearer SUA_CHAVE</code>. Limite de 500
            requisições por hora por chave.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">GET /api/public/products</code> — listar produtos publicados</li>
            <li><code className="bg-gray-100 px-1 rounded">GET /api/public/customers</code> — listar clientes</li>
            <li><code className="bg-gray-100 px-1 rounded">GET /api/public/bookings</code> — listar reservas</li>
            <li><code className="bg-gray-100 px-1 rounded">POST /api/public/bookings</code> — criar reserva</li>
          </ul>
          <a href="/api/public/docs" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary,#0ea5e9)] underline">
            Ver especificação completa (OpenAPI JSON)
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
