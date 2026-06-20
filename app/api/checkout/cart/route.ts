export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  rate_id: z.string().uuid(),
  checkin: z.string().nullable().optional(),
  checkout: z.string().nullable().optional(),
  guests: z.number().min(1).max(99).default(1),
});

const schema = z.object({
  tenant_id: z.string().uuid(),
  customer_name: z.string().min(2).max(200),
  customer_email: z.string().email(),
  customer_phone: z.string().max(30).optional(),
  items: z.array(itemSchema).min(1).max(20),
});

function nightsBetween(checkin?: string | null, checkout?: string | null): number {
  if (!checkin || !checkout) return 1;
  const n = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
  return Math.max(1, n);
}

function rateCoversDate(rate: { valid_from?: string | null; valid_to?: string | null }, checkin: string | null): boolean {
  if (!checkin) return false;
  const selected = checkin.slice(0, 10);
  if (rate.valid_from && selected < rate.valid_from.slice(0, 10)) return false;
  if (rate.valid_to && selected > rate.valid_to.slice(0, 10)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `cart:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const d = parsed.data;
  const service = createServiceClient();

  // Validate + price every item server-side (never trust client totals).
  type Line = { product_id: string; rate_id: string; checkin: string | null; checkout: string | null; guests: number; total: number; currency: string };
  const lines: Line[] = [];

  for (const item of d.items) {
    const { data: product } = await service
      .from("products")
      .select("id, status, sale_mode")
      .eq("id", item.product_id)
      .eq("tenant_id", d.tenant_id)
      .maybeSingle();
    if (!product || product.status !== "published" || product.sale_mode !== "booking") {
      return NextResponse.json({ error: "Um dos itens do carrinho não está mais disponível." }, { status: 400 });
    }

    if (!item.checkin) {
      return NextResponse.json({ error: "Selecione a data em todos os itens do carrinho." }, { status: 400 });
    }

    const { data: rate } = await service
      .from("product_rates")
      .select("id, price, currency, rate_type, valid_from, valid_to, occupancy_min, occupancy_max, available")
      .eq("id", item.rate_id)
      .eq("product_id", item.product_id)
      .eq("available", true)
      .maybeSingle();
    if (!rate) {
      return NextResponse.json({ error: "Tarifa inválida em um dos itens." }, { status: 400 });
    }

    if (!rateCoversDate(rate, item.checkin)) {
      return NextResponse.json({ error: "Uma tarifa nao esta disponivel para a data selecionada." }, { status: 400 });
    }
    if (item.guests < rate.occupancy_min || item.guests > rate.occupancy_max) {
      return NextResponse.json({ error: "Quantidade de pessoas fora da faixa permitida em um item." }, { status: 400 });
    }
    if (rate.rate_type === "per_night" && !item.checkout) {
      return NextResponse.json({ error: "Informe check-out para tarifas por noite." }, { status: 400 });
    }

    let total = Number(rate.price);
    if (rate.rate_type === "per_person") total = Number(rate.price) * item.guests;
    else if (rate.rate_type === "per_night") total = Number(rate.price) * nightsBetween(item.checkin, item.checkout);

    lines.push({
      product_id: item.product_id,
      rate_id: item.rate_id,
      checkin: item.checkin ?? null,
      checkout: item.checkout ?? null,
      guests: item.guests,
      total: Math.round(total * 100) / 100,
      currency: rate.currency ?? "BRL",
    });
  }

  const orderTotal = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  const currency = lines[0]?.currency ?? "BRL";

  // Upsert customer.
  const { data: customer } = await service
    .from("customers")
    .upsert(
      { tenant_id: d.tenant_id, name: d.customer_name, email: d.customer_email, phone: d.customer_phone ?? null },
      { onConflict: "tenant_id,email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  // Create the order.
  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      tenant_id: d.tenant_id,
      customer_id: customer?.id ?? null,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      total_price: orderTotal,
      currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Erro ao criar pedido. Tente novamente." }, { status: 500 });
  }

  // Create one booking per cart line, all linked to the order.
  const bookingRows = lines.map((l) => ({
    tenant_id: d.tenant_id,
    order_id: order.id,
    product_id: l.product_id,
    product_rate_id: l.rate_id,
    customer_id: customer?.id ?? null,
    customer_name: d.customer_name,
    customer_email: d.customer_email,
    customer_phone: d.customer_phone ?? null,
    check_in: l.checkin,
    check_out: l.checkout,
    guests: l.guests,
    total_price: l.total,
    currency: l.currency,
    status: "pending",
  }));

  const { error: bookingsError } = await service.from("bookings").insert(bookingRows);
  if (bookingsError) {
    // Roll back the order so we don't leave an empty one behind.
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Erro ao montar o pedido. Tente novamente." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id: d.tenant_id,
    action: "order.create",
    resource: "orders",
    resource_id: order.id,
    ip_address: ip,
    metadata: { items: lines.length, total: orderTotal },
  });

  triggerWebhookEvent(d.tenant_id, "booking.created", {
    order_id: order.id,
    items: lines.length,
    total_price: orderTotal,
    currency,
    customer_email: d.customer_email,
    status: "pending",
  }).catch(() => {});

  return NextResponse.json({ orderId: order.id });
}
