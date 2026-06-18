"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WhatsAppIntegrationFormProps {
  tenantId: string;
  status: "connected" | "disconnected" | "error";
  connectedAt: string | null;
}

export function WhatsAppIntegrationForm({ tenantId, status, connectedAt }: WhatsAppIntegrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [apiKey, setApiKey] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isConnected = status === "connected";

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/integrations/whatsapp/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, api_key: apiKey, phone_id: phoneId }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao conectar.");
        return;
      }
      setMode("view");
      setApiKey("");
      setPhoneId("");
      window.location.reload();
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      window.location.reload();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <CardTitle className="text-base">WhatsApp Business API</CardTitle>
            <p className="text-xs text-gray-400">Mensagens automáticas via 360dialog</p>
          </div>
        </div>
        <Badge variant={isConnected ? "success" : status === "error" ? "destructive" : "secondary"}>
          {isConnected ? "Conectado" : status === "error" ? "Erro" : "Desconectado"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isConnected && mode === "view" ? (
          <div className="space-y-3">
            {connectedAt && (
              <p className="text-xs text-gray-400">
                Conectado em {new Date(connectedAt).toLocaleDateString("pt-BR")}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                Atualizar credenciais
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">API Key (360dialog)</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number ID</Label>
              <Input
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="123456789012345"
                className="font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              {isConnected && (
                <Button variant="outline" size="sm" onClick={() => setMode("view")}>
                  Cancelar
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isPending || !apiKey || !phoneId}
                style={{ backgroundColor: "#25d366" }}
              >
                {isPending ? "Conectando..." : "Conectar WhatsApp"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
