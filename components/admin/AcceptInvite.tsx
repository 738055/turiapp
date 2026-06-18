"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Não foi possível aceitar o convite.");
      setBusy(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={busy}
        className="block w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
      >
        {busy ? "Entrando..." : "Aceitar convite e entrar"}
      </button>
    </div>
  );
}
