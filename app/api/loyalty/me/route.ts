export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLoyaltySessionCustomer } from "@/lib/loyalty/auth";
import { getLoyaltyBalance, getLoyaltyHistory } from "@/lib/loyalty/ledger";
import { getLoyaltySettings } from "@/lib/loyalty/settings";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id é obrigatório." }, { status: 400 });
  }

  const customer = await getLoyaltySessionCustomer(tenantId);
  if (!customer) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [balance, history, settings] = await Promise.all([
    getLoyaltyBalance(tenantId, customer.customerId),
    getLoyaltyHistory(tenantId, customer.customerId),
    getLoyaltySettings(tenantId),
  ]);

  return NextResponse.json({
    customer: { name: customer.name, email: customer.email },
    balance,
    discountAvailable: Math.round(balance * settings.redeem_value_per_point * 100) / 100,
    minRedeemPoints: settings.min_redeem_points,
    history,
  });
}
