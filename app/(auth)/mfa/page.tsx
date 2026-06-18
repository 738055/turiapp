"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, ShieldCheck } from "lucide-react";

function MfaChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const supabase = createClient();

  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    });
  }, [router, supabase]);

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.[0];
    if (!factor) {
      setError("Nenhum dispositivo autenticador encontrado nesta conta.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });

    setLoading(false);
    if (verifyError) {
      setError("Código incorreto. Tente novamente.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleBackupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/mfa/verify-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Código de backup inválido.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checkingSession) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TuriApp</h1>
        </div>

        <Card>
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-sky-600" />
            </div>
            <CardTitle className="text-lg">Verificação em duas etapas</CardTitle>
            <CardDescription>
              {mode === "totp"
                ? "Digite o código de 6 dígitos do seu app autenticador."
                : "Digite um dos seus códigos de backup."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "totp" ? handleTotpSubmit : handleBackupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">{mode === "totp" ? "Código de 6 dígitos" : "Código de backup"}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={mode === "totp" ? "000000" : "XXXXX-XXXXX"}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}
                style={{ backgroundColor: "#0ea5e9" }}>
                {loading ? "Verificando..." : "Confirmar"}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setMode(mode === "totp" ? "backup" : "totp"); setCode(""); setError(null); }}
                className="text-sky-600 hover:underline"
              >
                {mode === "totp" ? "Usar código de backup" : "Usar app autenticador"}
              </button>
              <button type="button" onClick={handleSignOut} className="text-gray-400 hover:text-gray-600">
                Sair
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MfaChallengePage() {
  return (
    <Suspense fallback={null}>
      <MfaChallengeContent />
    </Suspense>
  );
}
