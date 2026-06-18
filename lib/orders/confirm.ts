import type { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, renderVoucherHtml } from "@/lib/email/resend";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";
import { awardLoyaltyPoints } from "@/lib/loyalty/earn";

type Service = ReturnType<typeof createServiceClient>;

/**
 * Confirm a paid multi-product order: mark the order paid, confirm every booking
 * it contains, and run the same per-booking side effects as a single-product
 * purchase (voucher email, loyalty points, booking.confirmed webhook). Idempotent
 * — bookings already confirmed / vouchers already sent are skipped. Returns true
 * if the order was found and processed.
 */
export async function confirmOrder(
  service: Service,
  params: { orderId: string; tenantId: string; provider: "stripe" | "mercadopago"; paymentId: string }
): Promise<boolean> {
  const { orderId, tenantId, provider, paymentId } = params;

  const { data: order } = await service
    .from("orders")
    .select("id, status, tenant_id")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!order) return false;

  if (order.status !== "paid") {
    await service
      .from("orders")
      .update({ status: "paid", payment_provider: provider, payment_id: paymentId, updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }

  const { data: bookings } = await service
    .from("bookings")
    .select("*, products(title)")
    .eq("order_id", orderId)
    .eq("tenant_id", tenantId);

  if (!bookings?.length) return true;

  const [{ data: tenant }, { data: theme }] = await Promise.all([
    service.from("tenants").select("name, slug").eq("id", tenantId).single(),
    service.from("themes").select("primary_color, logo_url").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  for (const booking of bookings) {
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      await service
        .from("bookings")
        .update({ status: "confirmed", payment_provider: provider, payment_id: paymentId, updated_at: new Date().toISOString() })
        .eq("id", booking.id as string);

      triggerWebhookEvent(tenantId, "booking.confirmed", {
        booking_id: booking.id,
        order_id: orderId,
        product_id: booking.product_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        status: "confirmed",
      }).catch(() => {});

      awardLoyaltyPoints(tenantId, booking.id as string).catch(() => {});
    }

    if (!booking.voucher_sent_at && tenant) {
      const productTitle = (booking.products as unknown as { title: string } | null)?.title ?? "Produto";
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
        await service.from("bookings").update({ voucher_sent_at: new Date().toISOString() }).eq("id", booking.id as string);
      } catch {
        // Email failure must not abort the rest of the order.
      }
    }
  }

  return true;
}
