"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, ArrowLeft } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(data.error ?? "Muitas tentativas. Aguarde alguns minutos.");
        setLoading(false);
        return;
      }

      // Same message regardless of whether the email exists or the request succeeded.
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TuriApp</h1>
          <p className="text-sm text-gray-500 mt-1">Recuperar senha</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p className="text-sm text-gray-700 bg-green-50 rounded-md px-3 py-3">
                Se este e-mail existir em nossa base, enviamos um link de recuperação. Confira sua
                caixa de entrada (e o spam).
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    required
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}
                  style={{ backgroundColor: "#0ea5e9" }}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-sky-600 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
