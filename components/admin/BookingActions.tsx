"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, RotateCcw } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
  customerEmail: string;
  tenantId: string;
}

export function BookingActions({ bookingId, currentStatus, customerEmail, tenantId }: BookingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doAction(action: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/bookings/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, tenant_id: tenantId, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao executar ação.");
        return;
      }
      setMessage(body.message ?? "Ação executada com sucesso.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ações</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {currentStatus === "pending" && (
            <Button
              size="sm"
              onClick={() => doAction("confirm")}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Confirmar reserva
            </Button>
          )}
          {["pending", "confirmed"].includes(currentStatus) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => doAction("cancel")}
              disabled={isPending}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancelar reserva
            </Button>
          )}
          {currentStatus === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => doAction("complete")}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Marcar como concluída
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => doAction("resend_voucher")}
            disabled={isPending}
          >
            <Mail className="h-4 w-4 mr-1" /> Reenviar voucher
          </Button>
        </div>

        {message && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
