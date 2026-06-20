export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { sendEmail, renderBookingNotificationHtml } from "@/lib/email/resend";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";
import { sendPushToUsers } from "@/lib/push/send";
import { featureAllowed, getPlanLimits } from "@/lib/plans/limits";

const schema = z.object({
  tenant_id: z.string().uuid(),
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
  // Rate limit: 10 booking attempts per IP per 10 minutes
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `booking:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  if (!d.checkin) {
    return NextResponse.json({ error: "Selecione a data para consultar as tarifas." }, { status: 400 });
  }

  // Verify product belongs to tenant and is published
  const { data: product } = await service
    .from("products")
    .select("id, status, sale_mode")
    .eq("id", d.product_id)
    .eq("tenant_id", d.tenant_id)
    .single();

  if (!product || product.status !== "published") {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }
  if (product.sale_mode !== "booking") {
    return NextResponse.json({ error: "Este produto não aceita reservas online." }, { status: 400 });
  }

  const limits = await getPlanLimits(service, d.tenant_id);
  if (!featureAllowed(limits, "booking_engine")) {
    return NextResponse.json({ error: "Reserva online indisponivel no plano atual." }, { status: 403 });
  }

  const { data: rate } = await service
    .from("product_rates")
    .select("id, price, currency, rate_type, occupancy_min, occupancy_max, available, valid_from, valid_to")
    .eq("id", d.rate_id)
    .eq("product_id", d.product_id)
    .eq("available", true)
    .single();

  if (!rate) {
    return NextResponse.json({ error: "Tarifa indisponivel." }, { status: 400 });
  }

  if (!rateCoversDate(rate, d.checkin)) {
    return NextResponse.json({ error: "Esta tarifa nao esta disponivel para a data selecionada." }, { status: 400 });
  }

  if (d.guests < rate.occupancy_min || d.guests > rate.occupancy_max) {
    return NextResponse.json({ error: "Quantidade de pessoas fora da faixa permitida para esta tarifa." }, { status: 400 });
  }

  const totalAmount = calculateBookingTotal({
    price: Number(rate.price),
    rateType: rate.rate_type as "fixed" | "per_person" | "per_night" | "per_group",
    guests: d.guests,
    checkin: d.checkin ?? null,
    checkout: d.checkout ?? null,
  });

  if (totalAmount === null) {
    return NextResponse.json({ error: "Informe check-in e check-out para tarifa por noite." }, { status: 400 });
  }

  // Upsert customer
  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", d.tenant_id)
    .eq("email", d.customer_email)
    .maybeSingle();

  const { data: customer } = await service
    .from("customers")
    .upsert(
      {
        tenant_id: d.tenant_id,
        name: d.customer_name,
        email: d.customer_email,
        phone: d.customer_phone ?? null,
      },
      { onConflict: "tenant_id,email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (!existingCustomer && customer) {
    triggerWebhookEvent(d.tenant_id, "customer.created", {
      customer_id: customer.id,
      name: d.customer_name,
      email: d.customer_email,
      phone: d.customer_phone ?? null,
    }).catch(() => {});
  }

  // Create booking
  const { data: booking, error } = await service
    .from("bookings")
    .insert({
      tenant_id: d.tenant_id,
      product_id: d.product_id,
      product_rate_id: d.rate_id,
      customer_id: customer?.id ?? null,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      customer_phone: d.customer_phone ?? null,
      check_in: d.checkin ?? null,
      check_out: d.checkout ?? null,
      guests: d.guests,
      total_price: totalAmount,
      currency: (rate.currency as string) ?? d.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Erro ao criar reserva. Tente novamente." }, { status: 500 });
  }

  // Audit log
  await writeAuditLog({
    tenant_id: d.tenant_id,
    action: "booking.create",
    resource: "bookings",
    resource_id: booking.id,
    ip_address: ip,
    metadata: { product_id: d.product_id, customer_email: d.customer_email },
  });

  triggerWebhookEvent(d.tenant_id, "booking.created", {
    booking_id: booking.id,
    product_id: d.product_id,
    customer_name: d.customer_name,
    customer_email: d.customer_email,
    customer_phone: d.customer_phone ?? null,
    checkin: d.checkin ?? null,
    checkout: d.checkout ?? null,
    guests: d.guests,
    total_price: totalAmount,
    currency: (rate.currency as string) ?? d.currency,
    status: "pending",
  }).catch(() => {});

  // Notify tenant owner/admin (fire-and-forget)
  notifyTenant({
    service,
    tenantId: d.tenant_id,
    bookingId: booking.id,
    productId: d.product_id,
    booking: d,
    totalAmount,
    currency: (rate.currency as string) ?? d.currency,
  }).catch(() => {});

  return NextResponse.json({ bookingId: booking.id });
}

function calculateBookingTotal({
  price,
  rateType,
  guests,
  checkin,
  checkout,
}: {
  price: number;
  rateType: "fixed" | "per_person" | "per_night" | "per_group";
  guests: number;
  checkin: string | null;
  checkout: string | null;
}): number | null {
  if (rateType === "per_person") return price * guests;
  if (rateType !== "per_night") return price;
  if (!checkin || !checkout) return null;

  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return price * Math.max(1, nights);
}

function rateCoversDate(rate: { valid_from?: string | null; valid_to?: string | null }, checkin: string | null): boolean {
  if (!checkin) return false;
  const selected = checkin.slice(0, 10);
  if (rate.valid_from && selected < rate.valid_from.slice(0, 10)) return false;
  if (rate.valid_to && selected > rate.valid_to.slice(0, 10)) return false;
  return true;
}

interface NotifyPayload {
  service: ReturnType<typeof createServiceClient>;
  tenantId: string;
  bookingId: string;
  productId: string;
  booking: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    checkin?: string | null;
    checkout?: string | null;
    guests: number;
  };
  totalAmount: number;
  currency: string;
}

async function notifyTenant({ service, tenantId, bookingId, productId, booking, totalAmount, currency }: NotifyPayload) {
  const [{ data: tenant }, { data: product }, { data: members }, { data: theme }] = await Promise.all([
    service.from("tenants").select("name, slug").eq("id", tenantId).single(),
    service.from("products").select("title").eq("id", productId).single(),
    service.from("tenant_members").select("user_id, role").eq("tenant_id", tenantId)
      .in("role", ["tenant_owner", "tenant_admin"]),
    service.from("themes").select("primary_color").eq("tenant_id", tenantId).single(),
  ]);

  if (!tenant || !members?.length) return;

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";
  const adminUrl = `https://app.${platformDomain}/reservas/${bookingId}`;

  // Native push notification to the owners/admins who opted in.
  sendPushToUsers(
    members.map((m) => m.user_id),
    {
      title: "Nova reserva recebida 🎉",
      body: `${booking.customer_name} — ${product?.title ?? "Produto"}`,
      url: `/reservas/${bookingId}`,
    }
  ).catch(() => {});

  const html = renderBookingNotificationHtml({
    bookingId,
    productTitle: product?.title ?? "Produto",
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone ?? null,
    checkinDate: booking.checkin ?? null,
    checkoutDate: booking.checkout ?? null,
    guests: booking.guests,
    totalPrice: totalAmount,
    currency,
    tenantName: tenant.name,
    primaryColor: theme?.primary_color ?? "#0ea5e9",
    adminUrl,
  });

  for (const member of members) {
    const { data: authUser } = await service.auth.admin.getUserById(member.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    await sendEmail({
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      to: email,
      subject: `Nova reserva: ${product?.title ?? "Produto"} — ${booking.customer_name}`,
      html,
    });
  }
}
