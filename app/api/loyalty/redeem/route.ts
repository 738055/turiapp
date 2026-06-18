export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getLoyaltySessionCustomer } from "@/lib/loyalty/auth";
import { getLoyaltySettings, computeRedeemDiscount } from "@/lib/loyalty/settings";
import { getLoyaltyBalance } from "@/lib/loyalty/ledger";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  points: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { tenant_id, booking_id, points } = parsed.data;

  const customer = await getLoyaltySessionCustomer(tenant_id);
  if (!customer) {
    return NextResponse.json({ error: "Faça login na sua conta de fidelidade para usar seus pontos." }, { status: 401 });
  }

  const settings = await getLoyaltySettings(tenant_id);
  if (!settings.active) {
    return NextResponse.json({ error: "Programa de fidelidade desativado." }, { status: 400 });
  }
  if (points < settings.min_redeem_points) {
    return NextResponse.json({ error: `Mínimo de ${settings.min_redeem_points} pontos para resgate.` }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: booking } = await service
    .from("bookings")
    .select("id, customer_id, total_price, loyalty_points_redeemed, status")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!booking || booking.status !== "pending") {
    return NextResponse.json({ error: "Reserva não encontrada ou já paga." }, { status: 404 });
  }
  if (booking.customer_id !== customer.customerId) {
    return NextResponse.json({ error: "Esta reserva não pertence à sua conta." }, { status: 403 });
  }
  if (booking.loyalty_points_redeemed > 0) {
    return NextResponse.json({ error: "Desconto de fidelidade já aplicado a esta reserva." }, { status: 400 });
  }

  const balance = await getLoyaltyBalance(tenant_id, customer.customerId);
  if (balance < points) {
    return NextResponse.json({ error: "Saldo de pontos insuficiente." }, { status: 400 });
  }

  const { points: usedPoints, discount } = computeRedeemDiscount(settings, points, booking.total_price as number);
  const newTotal = Math.round(((booking.total_price as number) - discount) * 100) / 100;

  await service
    .from("bookings")
    .update({
      total_price: newTotal,
      loyalty_points_redeemed: usedPoints,
      loyalty_discount_amount: discount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking_id);

  await service.from("loyalty_points").insert({
    tenant_id,
    customer_id: customer.customerId,
    points: usedPoints,
    type: "redeem",
    reference_type: "booking",
    reference_id: booking_id,
    description: "Desconto aplicado na reserva",
  });

  await writeAuditLog({
    tenant_id,
    action: "loyalty.points_redeemed",
    resource: "bookings",
    resource_id: booking_id,
    metadata: { customer_id: customer.customerId, points: usedPoints, discount },
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ discount, newTotal, pointsUsed: usedPoints });
}
