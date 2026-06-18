"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WEBHOOK_EVENT_TYPES, WEBHOOK_EVENT_LABEL, type WebhookEventType } from "@/lib/webhooks/events";
import type { WebhookEndpoint, WebhookDelivery } from "@/types";

interface DeliveryWithEndpoint extends WebhookDelivery {
  webhook_endpoints: { url: string } | null;
}

interface WebhookManagerProps {
  tenantId: string;
  endpoints: WebhookEndpoint[];
  deliveries: DeliveryWithEndpoint[];
}

const STATUS_VARIANT: Record<string, "success" | "destructive" | "secondary"> = {
  success: "success",
  failed: "destructive",
  pending: "secondary",
};

export function WebhookManager({ tenantId, endpoints, deliveries }: WebhookManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEventType[]>([]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setUrl("");
    setEvents([]);
    setActive(true);
    setError(null);
  }

  function startEdit(endpoint: WebhookEndpoint) {
    setEditingId(endpoint.id);
    setUrl(endpoint.url);
    setEvents(endpoint.events as WebhookEventType[]);
    setActive(endpoint.active);
    setShowForm(true);
  }

  function toggleEvent(event: WebhookEventType) {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  }

  function handleSave() {
    setError(null);
    if (!url || events.length === 0) {
      setError("Informe a URL e selecione ao menos um evento.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/integrations/webhooks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint_id: editingId ?? undefined, tenant_id: tenantId, url, events, active }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Erro ao salvar webhook.");
        return;
      }
      if (result.secret) setRevealedSecret(result.secret);
      resetForm();
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este webhook? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await fetch("/api/integrations/webhooks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint_id: id, tenant_id: tenantId }),
      });
      window.location.reload();
    });
  }

  function handleRotate(id: string) {
    if (!confirm("Gerar um novo segredo? O segredo antigo deixará de funcionar.")) return;
    startTransition(async () => {
      const res = await fetch("/api/integrations/webhooks/rotate-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint_id: id, tenant_id: tenantId }),
      });
      const result = await res.json();
      if (res.ok) setRevealedSecret(result.secret);
    });
  }

  function handleRetry(deliveryId: string) {
    startTransition(async () => {
      await fetch("/api/integrations/webhooks/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_id: deliveryId, tenant_id: tenantId }),
      });
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      {revealedSecret && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-amber-900">
              Copie este segredo agora — ele não será exibido novamente:
            </p>
            <code className="block mt-2 p-2 bg-white border rounded text-sm break-all">{revealedSecret}</code>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setRevealedSecret(null)}>
              Já copiei
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Endpoints configurados</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Novo webhook
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="space-y-1">
                <Label className="text-xs">URL de destino</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com/webhook"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Eventos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENT_TYPES.map((evt) => (
                    <div key={evt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`evt-${evt}`}
                        checked={events.includes(evt)}
                        onChange={() => toggleEvent(evt)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`evt-${evt}`} className="text-sm font-normal cursor-pointer">
                        {WEBHOOK_EVENT_LABEL[evt]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                  Ativo
                </Label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}

          {endpoints.length === 0 && !showForm && (
            <p className="text-sm text-gray-400">Nenhum webhook configurado ainda.</p>
          )}

          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-sm break-all">{endpoint.url}</code>
                <Badge variant={endpoint.active ? "success" : "secondary"}>
                  {endpoint.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {endpoint.events.map((evt) => (
                  <Badge key={evt} variant="secondary" className="text-xs">
                    {WEBHOOK_EVENT_LABEL[evt as WebhookEventType] ?? evt}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(endpoint)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRotate(endpoint.id)} disabled={isPending}>
                  Rotacionar segredo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(endpoint.id)}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log de entregas recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deliveries.length === 0 && <p className="text-sm text-gray-400">Nenhuma entrega registrada ainda.</p>}
          {deliveries.map((d) => (
            <div key={d.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <div className="min-w-0">
                <p className="font-medium">{WEBHOOK_EVENT_LABEL[d.event_type as WebhookEventType] ?? d.event_type}</p>
                <p className="text-xs text-gray-400 truncate">
                  {d.webhook_endpoints?.url ?? "—"} · {new Date(d.created_at).toLocaleString("pt-BR")} ·{" "}
                  {d.attempts} tentativa(s)
                  {d.response_code ? ` · HTTP ${d.response_code}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"}>{d.status}</Badge>
                {d.status !== "success" && (
                  <Button variant="outline" size="sm" onClick={() => handleRetry(d.id)} disabled={isPending}>
                    Reenviar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
