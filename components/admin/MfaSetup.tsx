"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";

interface MfaSetupProps {
  /** Shows messaging that TOTP is required for this account (super admin), not just recommended. */
  mandatory?: boolean;
}

export function MfaSetup({ mandatory = false }: MfaSetupProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [hasFactor, setHasFactor] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadFactors() {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.[0] ?? null;
    setHasFactor(!!verified);
    setFactorId(verified?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadFactors();
  }, []);

  async function startEnroll() {
    setError(null);
    setEnrolling(true);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnrolling(false);

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Erro ao iniciar o cadastro do autenticador.");
      return;
    }

    setPendingFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFactorId) return;
    setError(null);
    setConfirming(true);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingFactorId,
      code,
    });

    if (verifyError) {
      setError("Código incorreto. Verifique o app autenticador e tente novamente.");
      setConfirming(false);
      return;
    }

    const res = await fetch("/api/auth/mfa/backup-codes", { method: "POST" });
    const body = await res.json().catch(() => ({ codes: [] }));
    setBackupCodes(body.codes ?? []);

    setConfirming(false);
    setQrCode(null);
    setSecret(null);
    setPendingFactorId(null);
    setCode("");
    await loadFactors();
  }

  async function handleUnenroll() {
    if (!factorId) return;
    if (!window.confirm("Remover a verificação em duas etapas? Sua conta ficará menos protegida.")) {
      return;
    }
    setError(null);
    setUnenrolling(true);
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    setUnenrolling(false);

    if (unenrollError) {
      setError("Não foi possível remover agora. Talvez seja necessário confirmar o código novamente.");
      return;
    }

    setBackupCodes(null);
    await loadFactors();
  }

  async function regenerateBackupCodes() {
    setError(null);
    const res = await fetch("/api/auth/mfa/backup-codes", { method: "POST" });
    if (!res.ok) {
      setError("Erro ao gerar novos códigos de backup.");
      return;
    }
    const body = await res.json();
    setBackupCodes(body.codes ?? []);
  }

  function copyBackupCodes() {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {hasFactor ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
            Verificação em duas etapas (TOTP)
          </CardTitle>
          <CardDescription>
            {hasFactor
              ? "Ativada. O código do seu app autenticador (Google Authenticator, Authy, 1Password…) é exigido a cada login nesta conta."
              : mandatory
              ? "Obrigatória para contas de super admin. Escaneie o QR code com o Google Authenticator (ou Authy, Microsoft Authenticator, 1Password) para continuar acessando o painel."
              : "Opcional. Adicione uma camada extra de proteção escaneando o QR code com o Google Authenticator, Authy, Microsoft Authenticator ou 1Password."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          {hasFactor ? (
            <Button variant="destructive" size="sm" onClick={handleUnenroll} disabled={unenrolling}>
              {unenrolling ? "Removendo..." : "Remover verificação em duas etapas"}
            </Button>
          ) : !qrCode ? (
            <Button onClick={startEnroll} disabled={enrolling}>
              {enrolling ? "Iniciando..." : "Ativar verificação em duas etapas"}
            </Button>
          ) : (
            <form onSubmit={confirmEnroll} className="space-y-4">
              <div className="flex flex-col items-center gap-2 bg-gray-50 rounded-lg p-4">
                <img src={qrCode} alt="QR code para configurar o autenticador" className="h-40 w-40" />
                <p className="text-xs text-gray-500">Ou digite manualmente no app:</p>
                <code className="text-xs bg-white border rounded px-2 py-1 select-all">{secret}</code>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totp-code">Código de 6 dígitos</Label>
                <Input
                  id="totp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              <Button type="submit" disabled={confirming}>
                {confirming ? "Confirmando..." : "Confirmar e ativar"}
              </Button>
            </form>
          )}

          {hasFactor && (
            <Button variant="outline" size="sm" onClick={regenerateBackupCodes}>
              Gerar novos códigos de backup
            </Button>
          )}
        </CardContent>
      </Card>

      {backupCodes && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Guarde seus códigos de backup</CardTitle>
            <CardDescription>
              Use um destes códigos para entrar se perder acesso ao seu app autenticador. Cada
              código funciona uma única vez e eles não serão exibidos novamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white rounded-md p-3 border">
              {backupCodes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={copyBackupCodes}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copiar códigos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
