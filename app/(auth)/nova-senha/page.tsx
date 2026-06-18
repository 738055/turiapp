"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function NovaSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase exchanges the recovery link for a session and fires this event
    // before the link's hash fragment is processed by the SDK on page load.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TuriApp</h1>
          <p className="text-sm text-gray-500 mt-1">Criar nova senha</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Nova senha</CardTitle>
            <CardDescription>Escolha uma senha forte para sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <p className="text-sm text-gray-700 bg-green-50 rounded-md px-3 py-3">
                Senha atualizada! Redirecionando para o login...
              </p>
            ) : !ready ? (
              <p className="text-sm text-gray-500">
                Validando link de recuperação...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}
                  style={{ backgroundColor: "#0ea5e9" }}>
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
