export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { evaluateCoupon } from "@/lib/coupons/validate";

const schema = z.object({
  tenant_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  code: z.string().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await enforceRateLimit({ key: `coupon-apply:${ip}`, limit: 30, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, booking_id, code } = parsed.data;

  const service = createServiceClient();

  const { data: booking } = await service
    .from("bookings")
    .select("id, total_price, status, coupon_code, coupon_discount_amount")
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .single();

  if (!booking) return NextResponse.json({ error: "Reserva não encontrada ou já paga." }, { status: 404 });

  // One coupon per booking — idempotent. Re-submitting the same code returns the
  // already-applied discount instead of stacking or double-counting usage.
  if (booking.coupon_code) {
    if (booking.coupon_code.toUpperCase() === code.toUpperCase()) {
      return NextResponse.json({
        ok: true,
        code: booking.coupon_code,
        discount: Number(booking.coupon_discount_amount),
        finalTotal: Number(booking.total_price),
        alreadyApplied: true,
      });
    }
    return NextResponse.json({ error: "Já há um cupom aplicado nesta reserva." }, { status: 409 });
  }

  const { data: coupon } = await service
    .from("coupons")
    .select("id, code, type, value, min_order, max_uses, uses_count, expires_at, active")
    .eq("tenant_id", tenant_id)
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!coupon) return NextResponse.json({ error: "Cupom inválido." }, { status: 404 });

  // The order total here is the current booking total (already net of any loyalty
  // redemption applied earlier in the checkout).
  const orderTotal = Number(booking.total_price);
  const evaluation = evaluateCoupon(coupon, orderTotal);
  if (!evaluation.valid) {
    return NextResponse.json({ error: evaluation.reason ?? "Cupom inválido." }, { status: 400 });
  }

  // Claim the booking first (guarded so only one concurrent request wins), then
  // consume a use. If consumption fails (raced to the last use), revert the
  // booking so we never give a discount without counting it.
  const { data: updated, error: updateError } = await service
    .from("bookings")
    .update({
      total_price: evaluation.finalTotal,
      coupon_code: coupon.code,
      coupon_discount_amount: evaluation.discount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking_id)
    .eq("tenant_id", tenant_id)
    .eq("status", "pending")
    .is("coupon_code", null)
    .select("id");

  if (updateError || !updated?.length) {
    return NextResponse.json({ error: "Não foi possível aplicar o cupom. Recarregue e tente novamente." }, { status: 409 });
  }

  // Atomically consume one use (re-checks max_uses under the row lock).
  const { data: consumed } = await service.rpc("consume_coupon", { p_coupon_id: coupon.id });
  if (consumed !== true) {
    // Revert the booking — coupon was exhausted in a race.
    await service
      .from("bookings")
      .update({ total_price: orderTotal, coupon_code: null, coupon_discount_amount: 0 })
      .eq("id", booking_id)
      .eq("tenant_id", tenant_id);
    return NextResponse.json({ error: "Cupom esgotado." }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    code: coupon.code,
    discount: evaluation.discount,
    finalTotal: evaluation.finalTotal,
  });
}
