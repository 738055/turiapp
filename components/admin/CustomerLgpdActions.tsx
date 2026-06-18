"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Trash2, AlertTriangle } from "lucide-react";

interface CustomerLgpdActionsProps {
  tenantId: string;
  customerEmail: string;
  customerName: string;
}

export function CustomerLgpdActions({ tenantId, customerEmail, customerName }: CustomerLgpdActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exported, setExported] = useState<Record<string, unknown> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    startTransition(async () => {
      const res = await fetch("/api/lgpd/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerEmail, tenant_id: tenantId }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); return; }
      setExported(body);
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      const res = await fetch("/api/lgpd/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerEmail, tenant_id: tenantId, confirm: true }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); return; }
      router.push("/clientes");
    });
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4" /> LGPD — Direitos do titular
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-amber-700">
          Em cumprimento à LGPD, você pode exportar ou remover os dados de{" "}
          <strong>{customerName}</strong> a pedido do titular.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isPending}
            className="border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Exportar dados
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isPending}
            className={confirmDelete
              ? "border-red-500 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-red-200 text-red-600 hover:bg-red-50"
            }
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {confirmDelete ? "Confirmar exclusão permanente" : "Excluir dados"}
          </Button>
          {confirmDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {exported && (
          <div className="mt-3 rounded border border-amber-300 bg-white p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Dados exportados:</p>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(exported, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
