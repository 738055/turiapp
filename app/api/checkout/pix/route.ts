export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { createPixPayment } from "@/lib/mercadopago";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { reportError } from "@/lib/observability";

const schema = z.object({
  booking_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `checkout:pix:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { booking_id, tenant_id } = parsed.data;
  const service = createServiceClient();

  const { data: booking } = await service
    .from("bookings")
    .select("*, products(title)")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Reserva não encontrada ou já paga." }, { status: 404 });
  }

  const { data: tenant } = await service.from("tenants").select("slug").eq("id", tenant_id).single();
  if (!tenant) return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });

  const { data: paymentAccount } = await service
    .from("tenant_payment_accounts")
    .select("encrypted_credentials")
    .eq("tenant_id", tenant_id)
    .eq("provider", "mercadopago")
    .eq("status", "connected")
    .single();

  if (!paymentAccount?.encrypted_credentials) {
    return NextResponse.json({ error: "Pagamento via PIX não configurado por este estabelecimento." }, { status: 400 });
  }

  const creds = JSON.parse(paymentAccount.encrypted_credentials) as Record<string, string>;
  const accessToken = decrypt(creds.access_token);

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const notificationUrl = `${proto}://${host}/api/webhooks/mercadopago?tenant=${tenant.slug}`;

  const productTitle =
    typeof booking.products === "object" && booking.products !== null
      ? (booking.products as { title: string }).title
      : "Reserva";

  const nameParts = String(booking.customer_name ?? "").trim().split(/\s+/);

  try {
    const pix = await createPixPayment(accessToken, {
      amount: booking.total_price as number,
      description: `${productTitle} — reserva ${booking_id.slice(0, 8).toUpperCase()}`,
      payerEmail: booking.customer_email as string,
      payerFirstName: nameParts[0] || "Cliente",
      payerLastName: nameParts.slice(1).join(" ") || undefined,
      externalReference: booking_id,
      notificationUrl,
      expiresInMinutes: 30,
    });

    if (!pix.qr_code) {
      return NextResponse.json({ error: "Não foi possível gerar o PIX. Tente outro método." }, { status: 502 });
    }

    return NextResponse.json({
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64,
      ticket_url: pix.ticket_url ?? null,
      expiration: pix.expiration,
    });
  } catch (err) {
    await reportError(err, { scope: "checkout.pix", tenantId: tenant_id, metadata: { booking_id } });
    return NextResponse.json({ error: "Não foi possível gerar o PIX. Tente novamente." }, { status: 502 });
  }
}
