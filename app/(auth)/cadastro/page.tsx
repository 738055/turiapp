"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Check } from "lucide-react";

const BENEFITS = [
  "14 dias grátis para testar",
  "Sem cartão de crédito agora",
  "Suporte em português",
  "Cancele quando quiser",
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, company: form.company } },
    });

    if (authError || !data.user) {
      setError(authError?.message ?? "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    // A ?next= (e.g. accepting a team invite) means this user is joining an
    // existing tenant, not creating one — skip onboarding and send them there.
    // Only same-origin relative paths are honored (open-redirect guard).
    const nextParam = new URLSearchParams(window.location.search).get("next");
    const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

    if (!data.session) {
      // Email confirmation is pending — no session was created yet.
      const q = new URLSearchParams({ email: form.email });
      if (safeNext) q.set("next", safeNext);
      router.push(`/verificar-email?${q.toString()}`);
      return;
    }

    // Invited user joins the existing tenant; everyone else starts onboarding.
    router.push(safeNext ?? "/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left — benefits */}
        <div className="space-y-6 hidden md:block pt-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TuriApp</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Crie sua loja de turismo em minutos
            </h2>
            <p className="text-gray-500">
              Hospedagens, experiências, pacotes e muito mais. Tudo com sua marca.
            </p>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-gray-700">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <Card>
          <CardHeader>
            <CardTitle>Criar conta grátis</CardTitle>
            <CardDescription>14 dias de teste sem compromisso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" value={form.name} onChange={update("name")}
                  placeholder="João Silva" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Nome da empresa / agência</Label>
                <Input id="company" value={form.company} onChange={update("company")}
                  placeholder="Bolinha Tur" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={update("email")}
                  placeholder="joao@bolinhatur.com.br" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={form.password}
                  onChange={update("password")} placeholder="Mínimo 8 caracteres" required
                  autoComplete="new-password" />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}
                style={{ backgroundColor: "#0ea5e9" }}>
                {loading ? "Criando conta..." : "Criar conta grátis"}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Ao criar sua conta você concorda com os{" "}
                <Link href="/termos" className="underline">Termos de Uso</Link>{" "}
                e{" "}
                <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
              </p>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Já tem conta?{" "}
              <Link href="/login" className="text-sky-600 font-medium hover:underline">Entrar</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
