"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Copy, Check } from "lucide-react";

interface QuoteActionsProps {
  quoteId: string;
  quoteUrl: string;
  sent: boolean;
  statusLabel: string;
  statusVariant: "secondary" | "success" | "destructive" | "warning";
}

export function QuoteActions({ quoteId, quoteUrl, sent, statusLabel, statusVariant }: QuoteActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [justSent, setJustSent] = useState(sent);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/quotes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao enviar.");
        return;
      }
      setJustSent(true);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-end gap-2 flex-shrink-0">
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button size="sm" onClick={send} disabled={isPending}>
          <Send className="h-3.5 w-3.5 mr-1" /> {justSent ? "Reenviar" : "Enviar"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
