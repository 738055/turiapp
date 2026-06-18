"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/types";

interface QuoteResponseWidgetProps {
  token: string;
  status: QuoteStatus;
  isExpired: boolean;
  expiresAt: string;
  primaryColor: string;
  bookingId: string | null;
}

function useCountdown(expiresAt: string) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Expirada");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setLabel(`${h}h ${m}min`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return label;
}

export function QuoteResponseWidget({
  token,
  status,
  isExpired,
  expiresAt,
  primaryColor,
  bookingId,
}: QuoteResponseWidgetProps) {
  const [localStatus, setLocalStatus] = useState<QuoteStatus>(isExpired ? "expired" : status);
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const countdown = useCountdown(expiresAt);

  function respond(action: "accept" | "decline") {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/quotes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, decline_reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao responder cotação.");
        return;
      }
      if (action === "accept" && data.bookingId) {
        window.location.href = `/checkout/${data.bookingId}`;
        return;
      }
      setLocalStatus("declined");
    });
  }

  if (localStatus === "accepted" || bookingId) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
        Cotação aceita! Sua reserva foi criada.
      </div>
    );
  }

  if (localStatus === "declined") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-600">
        Você recusou esta cotação. Entre em contato se mudar de ideia.
      </div>
    );
  }

  if (localStatus === "expired") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
        Esta proposta expirou. Solicite uma nova cotação.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-gray-400">
        Esta proposta expira em <strong>{countdown}</strong>
      </p>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {!showDecline ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDecline(true)}
            disabled={isPending}
          >
            Recusar
          </Button>
          <Button
            className="flex-1"
            style={{ backgroundColor: primaryColor }}
            onClick={() => respond("accept")}
            disabled={isPending}
          >
            {isPending ? "Processando..." : "Aceitar e reservar →"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDecline(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => respond("decline")}
              disabled={isPending}
            >
              Confirmar recusa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
