export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Stripe } from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({ order_id: z.string().uuid(), tenant_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `checkout:order:stripe:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas de pagamento." }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { order_id, tenant_id } = parsed.data;

  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select("id, customer_email, currency, status")
    .eq("id", order_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .single();
  if (!order) return NextResponse.json({ error: "Pedido não encontrado ou já pago." }, { status: 404 });

  const { data: bookings } = await service
    .from("bookings")
    .select("total_price, currency, products(title)")
    .eq("order_id", order_id)
    .eq("tenant_id", tenant_id);
  if (!bookings?.length) return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });

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
  const stripe = new Stripe(decrypt(creds.secret_key), { apiVersion: "2026-05-27.dahlia", typescript: true });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer_email,
    line_items: bookings.map((b) => ({
      price_data: {
        currency: ((b.currency as string) ?? "brl").toLowerCase(),
        product_data: { name: (b.products as unknown as { title: string } | null)?.title ?? "Item" },
        unit_amount: Math.round((b.total_price as number) * 100),
      },
      quantity: 1,
    })),
    metadata: { order_id },
    success_url: `${baseUrl}/checkout/pedido/sucesso?orderId=${order_id}`,
    cancel_url: `${baseUrl}/checkout/pedido/${order_id}?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
