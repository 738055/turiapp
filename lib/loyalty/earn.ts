import { createServiceClient } from "@/lib/supabase/server";
import { getLoyaltySettings, computeEarnedPoints } from "@/lib/loyalty/settings";
import { sendEmail, renderLoyaltyEarnedEmailHtml } from "@/lib/email/resend";
import { writeAuditLog } from "@/lib/audit";

/** Awards loyalty points for a confirmed booking, idempotently. Never throws. */
export async function awardLoyaltyPoints(tenantId: string, bookingId: string): Promise<void> {
  try {
    const service = createServiceClient();

    const settings = await getLoyaltySettings(tenantId);
    if (!settings.active) return;

    const { data: existing } = await service
      .from("loyalty_points")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("type", "earn")
      .eq("reference_type", "booking")
      .eq("reference_id", bookingId)
      .maybeSingle();
    if (existing) return;

    const { data: booking } = await service
      .from("bookings")
      .select("customer_id, customer_name, customer_email, total_price")
      .eq("id", bookingId)
      .eq("tenant_id", tenantId)
      .single();

    if (!booking || !booking.customer_id) return;

    const points = computeEarnedPoints(settings, booking.total_price as number);
    if (points <= 0) return;

    await service.from("loyalty_points").insert({
      tenant_id: tenantId,
      customer_id: booking.customer_id,
      points,
      type: "earn",
      reference_type: "booking",
      reference_id: bookingId,
      description: "Reserva confirmada",
    });

    await writeAuditLog({
      tenant_id: tenantId,
      action: "loyalty.points_earned",
      resource: "loyalty_points",
      resource_id: bookingId,
      metadata: { customer_id: booking.customer_id, points },
    });

    const { data: tenant } = await service
      .from("tenants")
      .select("name, slug")
      .eq("id", tenantId)
      .single();
    const { data: theme } = await service
      .from("themes")
      .select("primary_color")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (tenant) {
      const html = renderLoyaltyEarnedEmailHtml({
        customerName: booking.customer_name,
        points,
        tenantName: tenant.name,
        primaryColor: theme?.primary_color ?? undefined,
      });
      await sendEmail({
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        to: booking.customer_email,
        subject: `Você ganhou ${points} pontos de fidelidade!`,
        html,
      });
    }
  } catch {
    // Loyalty point awarding must never break the caller's main flow
  }
}
