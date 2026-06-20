export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { createPreference, type MPPreferenceItem } from "@/lib/mercadopago";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({ order_id: z.string().uuid(), tenant_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `checkout:order:mp:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas de pagamento." }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { order_id, tenant_id } = parsed.data;

  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select("id, customer_name, customer_email, status")
    .eq("id", order_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .single();
  if (!order) return NextResponse.json({ error: "Pedido não encontrado ou já pago." }, { status: 404 });

  const { data: bookings } = await service
    .from("bookings")
    .select("product_id, total_price, currency, products(title)")
    .eq("order_id", order_id)
    .eq("tenant_id", tenant_id);
  if (!bookings?.length) return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });

  const { data: tenant } = await service.from("tenants").select("slug").eq("id", tenant_id).single();
  if (!tenant) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const { data: paymentAccount } = await service
    .from("tenant_payment_accounts")
    .select("encrypted_credentials")
    .eq("tenant_id", tenant_id)
    .eq("provider", "mercadopago")
    .eq("status", "connected")
    .single();
  if (!paymentAccount?.encrypted_credentials) {
    return NextResponse.json({ error: "Pagamento via Mercado Pago não configurado." }, { status: 400 });
  }

  const creds = JSON.parse(paymentAccount.encrypted_credentials) as Record<string, string>;
  const accessToken = decrypt(creds.access_token);

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;
  const notificationUrl = `${baseUrl}/api/webhooks/mercadopago?tenant=${tenant.slug}`;

  const items: MPPreferenceItem[] = bookings.map((b) => ({
    id: b.product_id as string,
    title: (b.products as unknown as { title: string } | null)?.title ?? "Item",
    quantity: 1,
    unit_price: b.total_price as number,
    currency_id: (b.currency as string) ?? "BRL",
  }));

  // external_reference is prefixed so the webhook can tell an order from a
  // single booking and confirm every booking in the order.
  const preference = await createPreference(
    accessToken,
    items,
    { name: order.customer_name as string, email: order.customer_email as string },
    {
      success: `${baseUrl}/checkout/pedido/sucesso?orderId=${order_id}`,
      failure: `${baseUrl}/checkout/pedido/${order_id}?cancelled=1`,
      pending: `${baseUrl}/checkout/pedido/sucesso?orderId=${order_id}&status=pending`,
    },
    `order_${order_id}`,
    { maxInstallments: 12, notificationUrl }
  );

  const isSandbox = accessToken.startsWith("TEST-");
  return NextResponse.json({ url: isSandbox ? preference.sandbox_init_point : preference.init_point });
}
