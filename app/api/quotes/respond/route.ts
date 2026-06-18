export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

const schema = z.object({
  token: z.string().min(10),
  action: z.enum(["accept", "decline"]),
  decline_reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit({ key: `quote-respond:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { token, action, decline_reason } = parsed.data;
  const service = createServiceClient();

  const { data: quote } = await service
    .from("quotes")
    .select("*")
    .eq("token", token)
    .single();

  if (!quote) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });

  if (quote.status !== "pending") {
    return NextResponse.json({ error: "Esta cotação já foi respondida." }, { status: 409 });
  }

  if (new Date(quote.expires_at) < new Date()) {
    await service.from("quotes").update({ status: "expired" }).eq("id", quote.id);
    return NextResponse.json({ error: "Esta cotação expirou." }, { status: 410 });
  }

  if (action === "decline") {
    await service
      .from("quotes")
      .update({ status: "declined", decline_reason: decline_reason ?? null, responded_at: new Date().toISOString() })
      .eq("id", quote.id);

    await service
      .from("leads")
      .update({ status: "negociando" })
      .eq("id", quote.lead_id);

    await writeAuditLog({
      tenant_id: quote.tenant_id,
      action: "quote.decline",
      resource: "quotes",
      resource_id: quote.id,
      ip_address: ip,
    });

    return NextResponse.json({ ok: true, status: "declined" });
  }

  // action === "accept" — create booking from the quote
  const { data: lead } = await service.from("leads").select("name, email, phone").eq("id", quote.lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", quote.tenant_id)
    .eq("email", lead.email)
    .maybeSingle();

  const { data: customer } = await service
    .from("customers")
    .upsert(
      { tenant_id: quote.tenant_id, name: lead.name, email: lead.email, phone: lead.phone ?? null },
      { onConflict: "tenant_id,email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (!existingCustomer && customer) {
    triggerWebhookEvent(quote.tenant_id, "customer.created", {
      customer_id: customer.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? null,
    }).catch(() => {});
  }

  const { data: booking, error: bookingError } = await service
    .from("bookings")
    .insert({
      tenant_id: quote.tenant_id,
      product_id: quote.product_id,
      product_rate_id: quote.rate_id,
      customer_id: customer?.id ?? null,
      customer_name: lead.name,
      customer_email: lead.email,
      customer_phone: lead.phone ?? null,
      check_in: quote.check_in,
      check_out: quote.check_out,
      guests: quote.guests,
      total_price: quote.total_price,
      currency: quote.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Erro ao criar reserva a partir da cotação." }, { status: 500 });
  }

  await service
    .from("quotes")
    .update({ status: "accepted", responded_at: new Date().toISOString(), booking_id: booking.id })
    .eq("id", quote.id);

  await service.from("leads").update({ status: "reservado" }).eq("id", quote.lead_id);

  await writeAuditLog({
    tenant_id: quote.tenant_id,
    action: "quote.accept",
    resource: "quotes",
    resource_id: quote.id,
    ip_address: ip,
    metadata: { booking_id: booking.id },
  });

  triggerWebhookEvent(quote.tenant_id, "booking.created", {
    booking_id: booking.id,
    product_id: quote.product_id,
    customer_name: lead.name,
    customer_email: lead.email,
    customer_phone: lead.phone ?? null,
    checkin: quote.check_in,
    checkout: quote.check_out,
    guests: quote.guests,
    total_price: quote.total_price,
    currency: quote.currency,
    status: "pending",
  }).catch(() => {});

  triggerWebhookEvent(quote.tenant_id, "quote.accepted", {
    quote_id: quote.id,
    booking_id: booking.id,
    product_id: quote.product_id,
    total_price: quote.total_price,
    currency: quote.currency,
  }).catch(() => {});

  return NextResponse.json({ ok: true, status: "accepted", bookingId: booking.id });
}
