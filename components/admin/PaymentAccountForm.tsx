"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConnectedAccount {
  provider: "stripe" | "mercadopago";
  status: string;
  connected_at?: string;
}

interface PaymentAccountFormProps {
  tenantId: string;
  accounts: ConnectedAccount[];
}

export function PaymentAccountForm({ tenantId, accounts }: PaymentAccountFormProps) {
  const stripeAccount = accounts.find((a) => a.provider === "stripe");
  const mpAccount = accounts.find((a) => a.provider === "mercadopago");

  return (
    <div className="space-y-5">
      <StripeCard tenantId={tenantId} account={stripeAccount} />
      <MercadoPagoCard tenantId={tenantId} account={mpAccount} />
    </div>
  );
}

function StripeCard({ tenantId, account }: { tenantId: string; account?: ConnectedAccount }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleConnect() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await fetch("/api/payments/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "stripe",
          tenant_id: tenantId,
          secret_key: secretKey,
          webhook_secret: webhookSecret || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao conectar.");
        return;
      }
      setSuccess(true);
      setMode("view");
      setSecretKey("");
      setWebhookSecret("");
      window.location.reload();
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await fetch("/api/payments/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, provider: "stripe" }),
      });
      window.location.reload();
    });
  }

  const isConnected = account?.status === "connected";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600" viewBox="0 0 60 25" fill="currentColor">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a11.3 11.3 0 0 1-4.56.905c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.65zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.1c-1.64 0-2.73-.63-3.46-1.07l-.02 4.96-4.54.97V5.84h4.04l.18 1.07c.71-.67 1.98-1.32 3.8-1.32 3.83 0 6.6 3.48 6.6 7.4 0 4.06-2.86 7.1-6.6 7.1zm-.84-11.69c-.86 0-1.42.29-1.77.64l.04 4.97c.33.31.89.6 1.73.6 1.7 0 2.64-1.58 2.64-3.12 0-1.55-.94-3.09-2.64-3.09zM27.7 3.7L23.14 4.7V.92l4.56-.97zm0 2.14v14.26H23.14V5.84zm-6.89 3.65c0-3.37 2.74-5.1 5.86-5.1 1.1 0 2.11.25 2.86.55v3.69a6.8 6.8 0 0 0-2.4-.5c-.88 0-1.47.33-1.47.89 0 .5.42.72 1.5 1.07 2.59.78 3.93 1.97 3.93 4.14 0 2.68-2.06 4.79-5.66 4.79-1.29 0-2.68-.37-3.72-.84V14.2c.96.5 2.4.97 3.48.97.9 0 1.5-.4 1.5-.98 0-.5-.41-.72-1.6-1.1-2.59-.79-3.28-2.3-3.28-4.6zM8.52 17.98c1.01 0 2-.41 2-.41v-2.9a5.2 5.2 0 0 1-1.3.19c-.87 0-1.49-.4-1.49-1.52V8.35H9.9V5.84H7.73V2.28L3.21 3.25V5.84H1.09v2.51H3.2v5.2c0 3.22 1.94 4.43 5.32 4.43z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">Stripe</CardTitle>
            <p className="text-xs text-gray-400">Cartão de crédito / Pix</p>
          </div>
        </div>
        <Badge variant={isConnected ? "success" : "secondary"}>
          {isConnected ? "Conectado" : "Desconectado"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isConnected && mode === "view" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
              Atualizar chaves
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
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Chave secreta (sk_live_... ou sk_test_...)</Label>
              <Input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_••••••••"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Webhook secret (opcional, whsec_...)</Label>
              <Input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_••••••••"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                Para receber confirmações automáticas de pagamento. Configure em{" "}
                <span className="font-mono">Stripe → Webhooks → Adicionar endpoint</span>.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              {isConnected && (
                <Button variant="outline" size="sm" onClick={() => setMode("view")}>
                  Cancelar
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isPending || !secretKey}
                style={{ backgroundColor: "#7c3aed" }}
              >
                {isPending ? "Conectando..." : "Conectar Stripe"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MercadoPagoCard({ tenantId, account }: { tenantId: string; account?: ConnectedAccount }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/payments/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "mercadopago",
          tenant_id: tenantId,
          access_token: accessToken,
          public_key: publicKey || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao conectar.");
        return;
      }
      setMode("view");
      setAccessToken("");
      setPublicKey("");
      window.location.reload();
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await fetch("/api/payments/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, provider: "mercadopago" }),
      });
      window.location.reload();
    });
  }

  const isConnected = account?.status === "connected";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center text-xl">
            💳
          </div>
          <div>
            <CardTitle className="text-base">Mercado Pago</CardTitle>
            <p className="text-xs text-gray-400">Pix, cartão, boleto</p>
          </div>
        </div>
        <Badge variant={isConnected ? "success" : "secondary"}>
          {isConnected ? "Conectado" : "Desconectado"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isConnected && mode === "view" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
              Atualizar chaves
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
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Access Token (APP_USR-...)</Label>
              <Input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="APP_USR-••••••••"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Public Key (opcional)</Label>
              <Input
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="APP_USR-••••••••"
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
                disabled={isPending || !accessToken}
                style={{ backgroundColor: "#009ee3" }}
              >
                {isPending ? "Conectando..." : "Conectar Mercado Pago"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
