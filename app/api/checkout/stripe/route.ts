export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Stripe } from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({
  booking_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // Creating payment sessions is an abuse path (cost + provider rate limits).
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `checkout:stripe:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { booking_id, tenant_id } = parsed.data;
  const service = createServiceClient();

  // Load booking with product
  const { data: booking } = await service
    .from("bookings")
    .select("*, products(title)")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Reserva não encontrada ou já paga." }, { status: 404 });
  }

  // Load tenant Stripe credentials
  const { data: paymentAccount } = await service
    .from("tenant_payment_accounts")
    .select("encrypted_credentials")
    .eq("tenant_id", tenant_id)
    .eq("provider", "stripe")
    .eq("status", "connected")
    .single();

  if (!paymentAccount?.encrypted_credentials) {
    return NextResponse.json({ error: "Pagamento via Stripe não configurado." }, { status: 400 });
  }

  const creds = JSON.parse(paymentAccount.encrypted_credentials) as Record<string, string>;
  const secretKey = decrypt(creds.secret_key);

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia", typescript: true });

  // Build base URL from request host
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const productTitle = typeof booking.products === "object" && booking.products !== null
    ? (booking.products as { title: string }).title
    : "Reserva";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.customer_email,
    line_items: [
      {
        price_data: {
          currency: (booking.currency ?? "brl").toLowerCase(),
          product_data: { name: productTitle },
          unit_amount: Math.round((booking.total_price as number) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { booking_id: booking.id as string },
    success_url: `${baseUrl}/checkout/sucesso?bookingId=${booking_id}`,
    cancel_url: `${baseUrl}/checkout/${booking_id}?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
