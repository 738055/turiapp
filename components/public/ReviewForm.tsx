"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rating, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Não foi possível enviar. Tente novamente.");
      setBusy(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-semibold text-gray-900">Avaliação enviada!</p>
        <p className="text-sm text-gray-500 mt-1">Obrigado por compartilhar sua experiência.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-1"
            aria-label={`${n} estrelas`}
          >
            <Star
              className="h-9 w-9 transition-colors"
              style={{ color: (hover || rating) >= n ? "#facc15" : "#e5e7eb" }}
              fill={(hover || rating) >= n ? "#facc15" : "none"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Conte como foi (opcional)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#0ea5e9)]"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}
      >
        {busy ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
