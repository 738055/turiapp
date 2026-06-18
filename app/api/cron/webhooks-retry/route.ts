export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { retryWebhookDelivery } from "@/lib/webhooks/dispatch";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no servidor." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: pending } = await service
    .from("webhook_deliveries")
    .select("id")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .limit(200);

  for (const delivery of pending ?? []) {
    await retryWebhookDelivery(delivery.id);
  }

  return NextResponse.json({ ok: true, processed: pending?.length ?? 0 });
}
