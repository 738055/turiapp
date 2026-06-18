"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Muitas tentativas. Aguarde alguns minutos.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError("E-mail ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    // Honor a safe relative ?next= (e.g. accepting a team invite), otherwise
    // fall back to the role-based redirect from the API. Only same-origin
    // relative paths are allowed — never an absolute URL (open-redirect guard).
    const nextParam = new URLSearchParams(window.location.search).get("next");
    const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
    router.push(safeNext ?? data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TuriApp</h1>
          <p className="text-sm text-gray-500 mt-1">Painel de controle</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar na sua conta</CardTitle>
            <CardDescription>Use o e-mail e senha cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}
                style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link href="/recuperar-senha" className="text-sky-600 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-sky-600 font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
