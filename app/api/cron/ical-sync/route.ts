export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncIcalImport } from "@/lib/ical/sync";

// Periodic re-sync of all external iCal feeds (Vercel Cron). Keeps availability
// blocks in step with the OTAs without the tenant clicking "sync" manually.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no servidor." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: imports } = await service
    .from("product_ical_imports")
    .select("id, product_id, url, source_label")
    .limit(500);

  let synced = 0;
  let failed = 0;
  for (const imp of imports ?? []) {
    const r = await syncIcalImport(service, imp);
    if (r.ok) synced++;
    else failed++;
  }

  return NextResponse.json({ ok: true, synced, failed });
}
