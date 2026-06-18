export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateApiKey, isApiKeyAuthError, requireWriteScope } from "@/lib/api-keys/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "refunded", "completed"] as const;

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (isApiKeyAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("per_page") ?? "20")));
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rangeFrom = (page - 1) * perPage;
  const rangeTo = rangeFrom + perPage - 1;

  let query = createServiceClient()
    .from("bookings")
    .select(
      "id, product_id, customer_name, customer_email, customer_phone, check_in, check_out, guests, total_price, currency, status, created_at",
      { count: "exact" }
    )
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "Erro ao listar reservas." }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: { page, per_page: perPage, total: count ?? 0 },
  });
}

const createSchema = z.object({
  product_id: z.string().uuid(),
  rate_id: z.string().uuid(),
  checkin: z.string().nullable().optional(),
  checkout: z.string().nullable().optional(),
  guests: z.number().min(1).max(99).default(1),
  customer_name: z.string().min(2).max(200),
  customer_email: z.string().email(),
  customer_phone: z.string().max(30).optional(),
  total_amount: z.number().min(0),
  currency: z.string().default("BRL"),
});

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (isApiKeyAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const scopeError = requireWriteScope(auth);
  if (scopeError) return NextResponse.json({ error: scopeError.error }, { status: scopeError.status });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  const { data: product } = await service
    .from("products")
    .select("id, status, sale_mode")
    .eq("id", d.product_id)
    .eq("tenant_id", auth.tenantId)
    .single();

  if (!product || product.status !== "published") {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }
  if (product.sale_mode !== "booking") {
    return NextResponse.json({ error: "Este produto não aceita reservas online." }, { status: 400 });
  }

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("email", d.customer_email)
    .maybeSingle();

  const { data: customer } = await service
    .from("customers")
    .upsert(
      {
        tenant_id: auth.tenantId,
        name: d.customer_name,
        email: d.customer_email,
        phone: d.customer_phone ?? null,
      },
      { onConflict: "tenant_id,email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (!existingCustomer && customer) {
    triggerWebhookEvent(auth.tenantId, "customer.created", {
      customer_id: customer.id,
      name: d.customer_name,
      email: d.customer_email,
      phone: d.customer_phone ?? null,
    }).catch(() => {});
  }

  const { data: booking, error } = await service
    .from("bookings")
    .insert({
      tenant_id: auth.tenantId,
      product_id: d.product_id,
      product_rate_id: d.rate_id,
      customer_id: customer?.id ?? null,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      customer_phone: d.customer_phone ?? null,
      check_in: d.checkin ?? null,
      check_out: d.checkout ?? null,
      guests: d.guests,
      total_price: d.total_amount,
      currency: d.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Erro ao criar reserva." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id: auth.tenantId,
    action: "api.booking.create",
    resource: "bookings",
    resource_id: booking.id,
    ip_address: getClientIp(req),
    metadata: { api_key_id: auth.apiKeyId, product_id: d.product_id },
  });

  triggerWebhookEvent(auth.tenantId, "booking.created", {
    booking_id: booking.id,
    product_id: d.product_id,
    customer_name: d.customer_name,
    customer_email: d.customer_email,
    customer_phone: d.customer_phone ?? null,
    checkin: d.checkin ?? null,
    checkout: d.checkout ?? null,
    guests: d.guests,
    total_price: d.total_amount,
    currency: d.currency,
    status: "pending",
  }).catch(() => {});

  return NextResponse.json({ data: { id: booking.id } }, { status: 201 });
}
