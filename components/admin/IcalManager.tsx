"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Copy, Check, Trash2, RefreshCw } from "lucide-react";

interface IcalImport {
  id: string;
  url: string;
  source_label: string | null;
  last_synced_at: string | null;
  last_error: string | null;
}

interface IcalManagerProps {
  productId: string;
  tenantId: string;
  icalToken: string;
  imports: IcalImport[];
}

export function IcalManager({ productId, tenantId, icalToken, imports }: IcalManagerProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/products/${productId}/calendar.ics?token=${icalToken}`
      : "";

  function copy() {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addImport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/products/ical/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, product_id: productId, url, source_label: label || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao adicionar calendário.");
      return;
    }
    setUrl("");
    setLabel("");
    router.refresh();
  }

  async function manage(action: "sync" | "delete", import_id: string) {
    setBusy(true);
    await fetch("/api/products/ical/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, import_id, action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-5 w-5 text-[var(--color-primary)]" /> Sincronização de calendário (iCal)
        </CardTitle>
        <CardDescription>
          Conecte este produto com Airbnb, Booking, VRBO e outros para manter as datas em dia automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export */}
        <div>
          <Label className="text-xs text-gray-500">Link do seu calendário (para colar nas OTAs)</Label>
          <div className="flex gap-2 mt-1.5">
            <input readOnly value={exportUrl} onFocus={(e) => e.currentTarget.select()} className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 text-xs h-9" />
            <Button variant="outline" size="sm" onClick={copy} type="button">
              {copied ? <><Check className="h-3.5 w-3.5 mr-1" /> Copiado</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</>}
            </Button>
          </div>
        </div>

        {/* Import form */}
        <form onSubmit={addImport} className="space-y-2 border-t pt-4">
          <Label className="text-xs text-gray-500">Importar calendário externo (URL .ics)</Label>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://...ics" required className="flex-1" />
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Airbnb" className="sm:w-32" />
            <Button type="submit" disabled={busy}>{busy ? "..." : "Adicionar"}</Button>
          </div>
        </form>

        {/* Imports list */}
        {imports.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            {imports.map((imp) => (
              <div key={imp.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{imp.source_label || imp.url}</p>
                  <p className="text-xs text-gray-400">
                    {imp.last_error
                      ? <span className="text-red-500">Erro: {imp.last_error}</span>
                      : imp.last_synced_at
                      ? `Sincronizado em ${new Date(imp.last_synced_at).toLocaleString("pt-BR")}`
                      : "Aguardando primeira sincronização"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[var(--color-primary)]" onClick={() => manage("sync", imp.id)} disabled={busy} title="Sincronizar agora">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => manage("delete", imp.id)} disabled={busy} title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
