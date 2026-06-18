"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Package } from "lucide-react";
import type { LeadStatus } from "@/types";

interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  product_id: string | null;
  product_title: string | null;
  created_at: string;
}

const COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "border-sky-300" },
  { key: "cotacao_enviada", label: "Cotação enviada", color: "border-indigo-300" },
  { key: "negociando", label: "Negociando", color: "border-amber-300" },
  { key: "reservado", label: "Reservado", color: "border-green-300" },
  { key: "perdido", label: "Perdido", color: "border-gray-300" },
];

export function LeadsKanban({ initialLeads }: { initialLeads: LeadItem[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [isPending, startTransition] = useTransition();

  function moveLead(leadId: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    startTransition(async () => {
      await fetch("/api/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col.key);
        return (
          <div key={col.key} className="space-y-3 min-w-[220px]">
            <div className={`flex items-center justify-between border-b-2 pb-2 ${col.color}`}>
              <p className="text-sm font-semibold">{col.label}</p>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.map((lead) => (
                <Card key={lead.id} className="opacity-100">
                  <CardContent className="p-3 space-y-2">
                    <p className="font-medium text-sm">{lead.name}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </p>
                      {lead.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </p>
                      )}
                      {lead.product_title && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Package className="h-3 w-3" /> {lead.product_title}
                        </p>
                      )}
                    </div>
                    {lead.message && (
                      <p className="text-xs text-gray-500 line-clamp-2 italic">&ldquo;{lead.message}&rdquo;</p>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <select
                        value={lead.status}
                        disabled={isPending}
                        onChange={(e) => moveLead(lead.id, e.target.value as LeadStatus)}
                        className="flex-1 rounded border border-gray-200 px-1.5 py-1 text-xs"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <Link
                      href={`/cotacoes/nova?lead_id=${lead.id}${lead.product_id ? `&product_id=${lead.product_id}` : ""}`}
                      className="block text-center text-xs font-medium text-sky-600 hover:underline pt-1"
                    >
                      Criar cotação →
                    </Link>
                  </CardContent>
                </Card>
              ))}
              {!items.length && (
                <p className="text-xs text-gray-300 text-center py-6">Sem leads</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
