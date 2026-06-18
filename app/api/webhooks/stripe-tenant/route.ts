export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { sendEmail, renderVoucherHtml } from "@/lib/email/resend";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";
import { awardLoyaltyPoints } from "@/lib/loyalty/earn";
import { confirmOrder } from "@/lib/orders/confirm";

export async function POST(req: NextRequest) {
  // The request includes the tenant slug so we know which tenant's Stripe to use
  const tenantSlug = req.headers.get("x-tenant-slug") ?? req.nextUrl.searchParams.get("tenant");
  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenant." }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const service = createServiceClient();

  // Resolve tenant
  const { data: tenant } = await service
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found." }, { status: 404 });

  // Get tenant's encrypted Stripe credentials
  const { data: paymentAccount } = await service
    .from("tenant_payment_accounts")
    .select("encrypted_credentials")
    .eq("tenant_id", tenant.id)
    .eq("provider", "stripe")
    .eq("status", "connected")
    .single();

  if (!paymentAccount?.encrypted_credentials) {
    return NextResponse.json({ error: "No Stripe account connected." }, { status: 400 });
  }

  const creds = JSON.parse(paymentAccount.encrypted_credentials) as Record<string, string>;
  const secretKey = decrypt(creds.secret_key);
  const webhookSecret = creds.webhook_secret ? decrypt(creds.webhook_secret) : null;

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia", typescript: true });

  // Verify webhook signature if secret available
  let event: Stripe.Event;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId = pi.metadata?.booking_id;
    if (!bookingId) return NextResponse.json({ received: true });

    // Update booking
    const { data: booking } = await service
      .from("bookings")
      .update({
        status: "confirmed",
        payment_provider: "stripe",
        payment_id: pi.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("tenant_id", tenant.id)
      .select("*, products(title), themes:tenants(themes(primary_color, logo_url))")
      .single();

    if (booking) {
      triggerWebhookEvent(tenant.id, "booking.confirmed", {
        booking_id: booking.id,
        product_id: booking.product_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        status: "confirmed",
      }).catch(() => {});
      awardLoyaltyPoints(tenant.id, booking.id).catch(() => {});
    }

    if (booking && !booking.voucher_sent_at) {
      await sendVoucher(booking, tenant);
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Multi-product order (cart) — confirm every booking it contains.
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await confirmOrder(service, {
        orderId,
        tenantId: tenant.id,
        provider: "stripe",
        paymentId: (session.payment_intent as string) ?? session.id,
      });
      return NextResponse.json({ received: true });
    }

    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return NextResponse.json({ received: true });

    const { data: booking } = await service
      .from("bookings")
      .update({
        status: "confirmed",
        payment_provider: "stripe",
        payment_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("tenant_id", tenant.id)
      .select("*")
      .single();

    if (booking) {
      triggerWebhookEvent(tenant.id, "booking.confirmed", {
        booking_id: booking.id,
        product_id: booking.product_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        status: "confirmed",
      }).catch(() => {});
      awardLoyaltyPoints(tenant.id, booking.id).catch(() => {});
    }

    if (booking && !booking.voucher_sent_at) {
      await sendVoucher(booking, tenant);
    }
  }

  return NextResponse.json({ received: true });
}

async function sendVoucher(
  booking: Record<string, unknown>,
  tenant: { id: string; name: string; slug: string }
) {
  const service = createServiceClient();

  // Load theme for colors
  const { data: theme } = await service
    .from("themes")
    .select("primary_color, logo_url")
    .eq("tenant_id", tenant.id)
    .single();

  const productTitle = typeof booking.products === "object" && booking.products !== null
    ? (booking.products as { title: string }).title
    : String(booking.products ?? "Produto");

  const html = renderVoucherHtml({
    bookingId: booking.id as string,
    productTitle,
    customerName: booking.customer_name as string,
    checkinDate: booking.check_in as string | null,
    checkoutDate: booking.check_out as string | null,
    guests: booking.guests as number,
    totalPrice: booking.total_price as number,
    currency: (booking.currency as string) ?? "BRL",
    tenantName: tenant.name,
    tenantLogoUrl: theme?.logo_url,
    primaryColor: theme?.primary_color ?? "#0ea5e9",
  });

  try {
    await sendEmail({
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      to: booking.customer_email as string,
      subject: `Reserva confirmada — ${productTitle}`,
      html,
    });

    await service
      .from("bookings")
      .update({ voucher_sent_at: new Date().toISOString() })
      .eq("id", booking.id as string);
  } catch {
    // Email failure shouldn't break the webhook
  }
}
