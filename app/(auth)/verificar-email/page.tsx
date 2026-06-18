"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, MailCheck } from "lucide-react";

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerificarEmailContent />
    </Suspense>
  );
}

function VerificarEmailContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setSending(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);
    setMessage(
      error
        ? "Não foi possível reenviar agora. Tente novamente em alguns minutos."
        : "E-mail reenviado! Confira sua caixa de entrada (e o spam)."
    );
  }

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
              <MailCheck className="h-6 w-6 text-sky-600" />
            </div>
            <CardTitle className="text-lg">Confirme seu e-mail</CardTitle>
            <CardDescription>
              {email ? (
                <>Enviamos um link de confirmação para <strong>{email}</strong>.</>
              ) : (
                "Enviamos um link de confirmação para o e-mail cadastrado."
              )}{" "}
              Clique no link para ativar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <p className="text-sm text-gray-700 bg-sky-50 rounded-md px-3 py-2">{message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={sending || !email}
              onClick={handleResend}
            >
              {sending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-sky-600 hover:underline">
                Já confirmei, ir para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
