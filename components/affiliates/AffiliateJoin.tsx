"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AffiliateJoin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/affiliates/join", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao entrar no programa.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <ul className="space-y-2 text-sm text-gray-600 mb-5">
        <li>• Comissão de 20% por cliente que assinar pelo seu link</li>
        <li>• Atribuição garantida por 30 dias após o clique</li>
        <li>• Acompanhe conversões e comissões neste painel</li>
      </ul>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-3">{error}</p>}
      <button
        onClick={join}
        disabled={busy}
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}
      >
        {busy ? "Gerando seu link..." : "Quero ser afiliado"}
      </button>
    </div>
  );
}
