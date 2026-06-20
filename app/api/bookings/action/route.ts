export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail, renderVoucherHtml, renderReviewRequestEmailHtml } from "@/lib/email/resend";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";
import type { WebhookEventType } from "@/lib/webhooks/events";
import { awardLoyaltyPoints } from "@/lib/loyalty/earn";
import { generateReviewToken, hashReviewToken } from "@/lib/reviews/token";

const schema = z.object({
  booking_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  action: z.enum(["confirm", "cancel", "complete", "refund", "resend_voucher"]),
});

const ACTION_STATUS: Record<string, string> = {
  confirm: "confirmed",
  cancel: "cancelled",
  complete: "completed",
  refund: "refunded",
};

const LEGACY_ACTION_STATUS: Partial<Record<string, string>> = {
  cancel: "canceled",
};

const ACTION_EVENT: Record<string, WebhookEventType> = {
  confirm: "booking.confirmed",
  cancel: "booking.cancelled",
  complete: "booking.completed",
  refund: "booking.refunded",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { booking_id, tenant_id, action } = parsed.data;
  const service = createServiceClient();

  // Auth check
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { data: booking } = await service
    .from("bookings")
    .select("*, products(title)")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });

  if (action === "resend_voucher") {
    const { data: tenant } = await service
      .from("tenants")
      .select("name, slug")
      .eq("id", tenant_id)
      .single();

    const { data: theme } = await service
      .from("themes")
      .select("primary_color, logo_url")
      .eq("tenant_id", tenant_id)
      .single();

    const productTitle = (booking.products as unknown as { title: string } | null)?.title ?? "Produto";

    const html = renderVoucherHtml({
      bookingId: booking.id,
      productTitle,
      customerName: booking.customer_name,
      checkinDate: booking.check_in,
      checkoutDate: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      currency: booking.currency,
      tenantName: tenant?.name ?? "Empresa",
      tenantLogoUrl: theme?.logo_url,
      primaryColor: theme?.primary_color,
    });

    await sendEmail({
      tenantSlug: tenant?.slug ?? "default",
      tenantName: tenant?.name ?? "Empresa",
      to: booking.customer_email,
      subject: `Voucher de reserva — ${productTitle}`,
      html,
    });

    await service
      .from("bookings")
      .update({ voucher_sent_at: new Date().toISOString() })
      .eq("id", booking_id);

    await writeAuditLog({
      tenant_id,
      user_id: user.id,
      action: "booking.voucher_resent",
      resource: "bookings",
      resource_id: booking_id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ message: `Voucher reenviado para ${booking.customer_email}.` });
  }

  // Status change
  const allowedTransitions: Record<string, string[]> = {
    pending: ["confirm", "cancel"],
    confirmed: ["cancel", "complete", "refund"],
    completed: ["refund"],
    cancelled: ["refund"],
    canceled: ["refund"],
  };
  if (!allowedTransitions[booking.status]?.includes(action)) {
    return NextResponse.json({ error: "Acao indisponivel para o status atual da reserva." }, { status: 400 });
  }

  const newStatus = ACTION_STATUS[action];
  const legacyStatus = LEGACY_ACTION_STATUS[action];
  if (booking.status === newStatus || (legacyStatus && booking.status === legacyStatus)) {
    return NextResponse.json({ message: "Reserva ja esta neste status.", status: normalizeBookingStatus(booking.status) });
  }

  const updateError = await updateBookingStatus(service, booking_id, tenant_id, newStatus, legacyStatus);
  if (updateError) return NextResponse.json({ error: updateError }, { status: 500 });

  const { data: updatedBooking, error: readAfterWriteError } = await service
    .from("bookings")
    .select("id, status")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .single();

  const expectedStoredStatuses = [newStatus, legacyStatus].filter(Boolean);
  if (readAfterWriteError || !updatedBooking || !expectedStoredStatuses.includes(updatedBooking.status)) {
    return NextResponse.json(
      { error: readAfterWriteError?.message ?? "A reserva nao confirmou a troca de status." },
      { status: 500 }
    );
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: `booking.${action}`,
    resource: "bookings",
    resource_id: booking_id,
    ip_address: getClientIp(req),
  });

  triggerWebhookEvent(tenant_id, ACTION_EVENT[action], {
    booking_id,
    product_id: booking.product_id,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    status: normalizeBookingStatus(updatedBooking.status),
  }).catch(() => {});

  if (action === "confirm") {
    awardLoyaltyPoints(tenant_id, booking_id).catch(() => {});
  }

  if (action === "complete") {
    // Ask the customer for a review (fire-and-forget; never blocks the action).
    requestReview(service, tenant_id, booking).catch(() => {});
  }

  const labels: Record<string, string> = {
    confirm: "Reserva confirmada com sucesso.",
    cancel: "Reserva cancelada.",
    complete: "Reserva marcada como concluída.",
    refund: "Reserva marcada como reembolsada.",
  };

  return NextResponse.json({ message: labels[action], status: normalizeBookingStatus(updatedBooking.status) });
}

async function updateBookingStatus(
  service: ReturnType<typeof createServiceClient>,
  bookingId: string,
  tenantId: string,
  status: string,
  fallbackStatus?: string
): Promise<string | null> {
  const update = async (nextStatus: string) => {
    const { error } = await service
      .from("bookings")
      .update({ status: nextStatus })
      .eq("id", bookingId)
      .eq("tenant_id", tenantId);
    return error;
  };

  const primaryError = await update(status);
  if (!primaryError) return null;

  if (fallbackStatus) {
    const fallbackError = await update(fallbackStatus);
    if (!fallbackError) return null;
  }

  return primaryError.message ?? "Nao foi possivel atualizar a reserva.";
}

function normalizeBookingStatus(status: string): string {
  return status === "canceled" ? "cancelled" : status;
}

// Creates a one-time review invite for a completed booking and emails the link.
// Idempotent via the unique(booking_id) constraint — a duplicate just no-ops.
async function requestReview(
  service: ReturnType<typeof createServiceClient>,
  tenantId: string,
  booking: { id: string; product_id: string; customer_id: string | null; customer_name: string; customer_email: string; products?: { title: string } | null }
) {
  const token = generateReviewToken();
  const { error } = await service.from("reviews").insert({
    tenant_id: tenantId,
    product_id: booking.product_id,
    booking_id: booking.id,
    customer_id: booking.customer_id ?? null,
    customer_name: booking.customer_name,
    token_hash: hashReviewToken(token),
    status: "pending",
  });

  // Duplicate (already invited) or any insert error → don't send an email.
  if (error) return;

  const [{ data: tenant }, { data: theme }] = await Promise.all([
    service.from("tenants").select("name, slug").eq("id", tenantId).single(),
    service.from("themes").select("primary_color").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  if (!tenant) return;

  const productTitle = (booking.products as { title: string } | null)?.title ?? "sua reserva";
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";
  const reviewUrl = `https://${tenant.slug}.${platformDomain}/avaliar/${token}`;

  await sendEmail({
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    to: booking.customer_email,
    subject: `Como foi sua experiência com ${productTitle}?`,
    html: renderReviewRequestEmailHtml({
      customerName: booking.customer_name,
      productTitle,
      tenantName: tenant.name,
      reviewUrl,
      primaryColor: theme?.primary_color ?? undefined,
    }),
  });
}
