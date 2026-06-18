export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { hashReviewToken } from "@/lib/reviews/token";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

const schema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `review-submit:${ip}`, limit: 15, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { token, rating, body } = parsed.data;
  const service = createServiceClient();

  const { data: review } = await service
    .from("reviews")
    .select("id, tenant_id, product_id, submitted_at")
    .eq("token_hash", hashReviewToken(token))
    .maybeSingle();

  if (!review) return NextResponse.json({ error: "Link de avaliação inválido." }, { status: 404 });
  if (review.submitted_at) {
    return NextResponse.json({ error: "Esta avaliação já foi enviada. Obrigado!" }, { status: 409 });
  }

  const { error } = await service
    .from("reviews")
    .update({
      rating,
      body: body?.trim() || null,
      submitted_at: new Date().toISOString(),
      status: "pending", // awaiting tenant moderation
    })
    .eq("id", review.id)
    .is("submitted_at", null);

  if (error) return NextResponse.json({ error: "Erro ao enviar avaliação." }, { status: 500 });

  triggerWebhookEvent(review.tenant_id, "review.submitted", {
    review_id: review.id,
    product_id: review.product_id,
    rating,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
