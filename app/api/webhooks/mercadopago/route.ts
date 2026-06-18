export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getPayment } from "@/lib/mercadopago";
import { sendEmail, renderVoucherHtml } from "@/lib/email/resend";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";
import { awardLoyaltyPoints } from "@/lib/loyalty/earn";
import { reportError } from "@/lib/observability";
import { confirmOrder } from "@/lib/orders/confirm";

export async function POST(req: NextRequest) {
  const tenantSlug = req.headers.get("x-tenant-slug") ?? req.nextUrl.searchParams.get("tenant");
  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenant." }, { status: 400 });
  }

  const body = await req.json() as { type?: string; data?: { id?: string } };
  if (body.type !== "payment") {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) return NextResponse.json({ received: true });

  const service = createServiceClient();

  const { data: tenant } = await service
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found." }, { status: 404 });

  const { data: paymentAccount } = await service
    .from("tenant_payment_accounts")
    .select("encrypted_credentials")
    .eq("tenant_id", tenant.id)
    .eq("provider", "mercadopago")
    .eq("status", "connected")
    .single();

  if (!paymentAccount?.encrypted_credentials) {
    return NextResponse.json({ error: "No MP account connected." }, { status: 400 });
  }

  const creds = JSON.parse(paymentAccount.encrypted_credentials) as Record<string, string>;
  const accessToken = decrypt(creds.access_token);

  const payment = await getPayment(accessToken, paymentId);
  if (!payment || payment.status !== "approved") {
    return NextResponse.json({ received: true });
  }

  const externalRef = payment.external_reference as string | undefined;
  if (!externalRef) return NextResponse.json({ received: true });

  // Multi-product order (cart): external_reference is "order_<id>".
  if (externalRef.startsWith("order_")) {
    const orderId = externalRef.slice("order_".length);
    await confirmOrder(service, { orderId, tenantId: tenant.id, provider: "mercadopago", paymentId: String(paymentId) });
    return NextResponse.json({ received: true });
  }

  const bookingId = externalRef;

  const { data: booking } = await service
    .from("bookings")
    .update({
      status: "confirmed",
      payment_provider: "mercadopago",
      payment_id: String(paymentId),
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
    const { data: theme } = await service
      .from("themes")
      .select("primary_color, logo_url")
      .eq("tenant_id", tenant.id)
      .single();

    const { data: product } = await service
      .from("products")
      .select("title")
      .eq("id", booking.product_id as string)
      .single();

    const html = renderVoucherHtml({
      bookingId: booking.id as string,
      productTitle: product?.title ?? "Produto",
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
        subject: `Reserva confirmada — ${product?.title ?? "Produto"}`,
        html,
      });
      await service
        .from("bookings")
        .update({ voucher_sent_at: new Date().toISOString() })
        .eq("id", booking.id as string);
    } catch (err) {
      // Email failure should not break webhook response, but it must be visible.
      await reportError(err, { scope: "webhook.mercadopago.voucher", tenantId: tenant.id, metadata: { bookingId: booking.id } });
    }
  }

  return NextResponse.json({ received: true });
}
