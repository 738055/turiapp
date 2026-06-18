export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Lightweight polling endpoint for the PIX widget: returns only the booking's
// payment status (never customer PII). Confirmation itself happens via the
// Mercado Pago webhook (matched by external_reference).
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("booking_id");
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!bookingId || !tenantId) {
    return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: booking } = await service
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });

  return NextResponse.json({ status: booking.status });
}
