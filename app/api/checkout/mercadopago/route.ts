export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { createPreference } from "@/lib/mercadopago";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({
  booking_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // Creating payment preferences is an abuse path (cost + provider rate limits).
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `checkout:mp:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de pagamento. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { booking_id, tenant_id } = parsed.data;
  const service = createServiceClient();

  // Load booking with product
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

  // Load tenant MP credentials
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

  // Build base URL from request host
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const productTitle = typeof booking.products === "object" && booking.products !== null
    ? (booking.products as { title: string }).title
    : "Reserva";

  const preference = await createPreference(
    accessToken,
    [
      {
        id: booking.product_id as string,
        title: productTitle,
        quantity: 1,
        unit_price: booking.total_price as number,
        currency_id: (booking.currency as string) ?? "BRL",
      },
    ],
    {
      name: booking.customer_name as string,
      email: booking.customer_email as string,
    },
    {
      success: `${baseUrl}/checkout/sucesso?bookingId=${booking_id}`,
      failure: `${baseUrl}/checkout/${booking_id}?cancelled=1`,
      pending: `${baseUrl}/checkout/sucesso?bookingId=${booking_id}&status=pending`,
    },
    booking_id,
    // Card in up to 12 installments; boleto stays available (default) for
    // higher-value products like packages and cruises.
    { maxInstallments: 12 }
  );

  const isSandbox = accessToken.startsWith("TEST-");
  const url = isSandbox ? preference.sandbox_init_point : preference.init_point;

  return NextResponse.json({ url });
}
