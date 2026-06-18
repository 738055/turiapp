export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateIcal, addDays, type IcalEvent } from "@/lib/ical";

// Public .ics feed for a product, gated by the product's secret ical_token so
// occupancy isn't world-readable. OTAs (Airbnb/VRBO/Booking) subscribe to this
// URL to mirror the product's busy dates. Exposes only dates — never customer PII.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new NextResponse("Token obrigatório.", { status: 401 });

  const service = createServiceClient();
  const { data: product } = await service
    .from("products")
    .select("id, title, ical_token")
    .eq("id", id)
    .maybeSingle();

  if (!product || !product.ical_token || product.ical_token !== token) {
    return new NextResponse("Não autorizado.", { status: 403 });
  }

  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    service
      .from("bookings")
      .select("id, check_in, check_out")
      .eq("product_id", id)
      .in("status", ["confirmed", "completed"])
      .not("check_in", "is", null),
    service
      .from("availability")
      .select("date")
      .eq("product_id", id)
      .eq("blocked", true),
  ]);

  const events: IcalEvent[] = [];

  for (const b of bookings ?? []) {
    const start = b.check_in as string;
    // iCal DTEND is exclusive; if no check_out, block a single night.
    const end = (b.check_out as string | null) ?? addDays(start, 1);
    events.push({ uid: `booking-${b.id}@turiapp`, start, end, summary: "Reservado" });
  }
  for (const blk of blocks ?? []) {
    const d = blk.date as string;
    events.push({ uid: `block-${id}-${d}@turiapp`, start: d, end: addDays(d, 1), summary: "Bloqueado" });
  }

  const ics = generateIcal(product.title ?? "Disponibilidade", events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${id}.ics"`,
      "Cache-Control": "public, max-age=900",
    },
  });
}
