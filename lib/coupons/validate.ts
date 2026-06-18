import type { Coupon } from "@/types";

export interface CouponEvaluation {
  valid: boolean;
  reason?: string;
  discount: number; // amount to subtract
  finalTotal: number;
}

/** Pure evaluation of a coupon against an order total. Caller is responsible for
 *  loading the coupon row and (separately) consuming a use atomically. */
export function evaluateCoupon(coupon: Pick<Coupon, "type" | "value" | "min_order" | "max_uses" | "uses_count" | "expires_at" | "active">, orderTotal: number): CouponEvaluation {
  const fail = (reason: string): CouponEvaluation => ({ valid: false, reason, discount: 0, finalTotal: orderTotal });

  if (!coupon.active) return fail("Cupom inativo.");
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return fail("Cupom expirado.");
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) return fail("Cupom esgotado.");
  if (orderTotal < coupon.min_order) {
    return fail(`Este cupom vale para pedidos a partir de ${formatBRL(coupon.min_order)}.`);
  }

  const raw = coupon.type === "percent" ? (orderTotal * coupon.value) / 100 : coupon.value;
  // Never discount below zero.
  const discount = Math.min(Math.max(0, round2(raw)), orderTotal);
  return { valid: true, discount, finalTotal: round2(orderTotal - discount) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
