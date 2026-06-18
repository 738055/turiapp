"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeadCaptureFormProps {
  tenantId: string;
  productId: string;
  primaryColor: string;
}

export function LeadCaptureForm({ tenantId, productId, primaryColor }: LeadCaptureFormProps) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, product_id: productId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao enviar solicitação.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
        Recebemos sua solicitação! Em breve enviaremos uma cotação personalizada por e-mail.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm font-medium underline"
        style={{ color: primaryColor }}
      >
        Prefere uma cotação personalizada? Solicite aqui
      </button>
    );
  }

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <h3 className="font-semibold text-sm">Solicitar cotação personalizada</h3>
      <div className="space-y-1">
        <Label className="text-xs">Nome</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">E-mail</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Telefone</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Mensagem (opcional)</Label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          style={{ backgroundColor: primaryColor }}
          onClick={submit}
          disabled={isPending || !form.name || !form.email}
        >
          {isPending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
