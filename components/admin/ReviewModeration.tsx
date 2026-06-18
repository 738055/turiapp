"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Clock } from "lucide-react";
import type { Review } from "@/types";

type Row = Review & { productTitle: string };

const STATUS_TABS: { key: Review["status"]; label: string }[] = [
  { key: "pending", label: "Aguardando" },
  { key: "approved", label: "Aprovadas" },
  { key: "rejected", label: "Recusadas" },
];

function Stars({ rating }: { rating: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="h-4 w-4" style={{ color: (rating ?? 0) >= n ? "#facc15" : "#e5e7eb" }} fill={(rating ?? 0) >= n ? "#facc15" : "none"} />
      ))}
    </div>
  );
}

export function ReviewModeration({ tenantId, reviews }: { tenantId: string; reviews: Row[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Review["status"]>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const counts = {
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };
  const visible = reviews.filter((r) => r.status === tab);

  async function moderate(reviewId: string, decision: "approved" | "rejected") {
    setBusy(reviewId);
    const res = await fetch("/api/reviews/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, review_id: reviewId, decision }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-400">
            Nenhuma avaliação {tab === "pending" ? "aguardando moderação" : tab === "approved" ? "aprovada" : "recusada"}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-gray-400">· {r.productTitle}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{r.customer_name}</p>
                    {r.body && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{r.body}</p>}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  {tab === "pending" && (
                    <div className="flex flex-shrink-0 gap-2">
                      <Button size="sm" onClick={() => moderate(r.id, "approved")} disabled={busy === r.id}>
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moderate(r.id, "rejected")} disabled={busy === r.id}>
                        <X className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  )}
                  {tab === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => moderate(r.id, "rejected")} disabled={busy === r.id}>
                      Remover do site
                    </Button>
                  )}
                  {tab === "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => moderate(r.id, "approved")} disabled={busy === r.id}>
                      Aprovar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
