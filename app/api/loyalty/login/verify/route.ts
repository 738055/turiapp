export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyLoyaltyLoginCode, setLoyaltySessionCookie } from "@/lib/loyalty/auth";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { tenant_id, email, code } = parsed.data;
  const ip = getClientIp(req) ?? "unknown";

  const rl = await enforceRateLimit({ key: `loyalty-verify:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const result = await verifyLoyaltyLoginCode(tenant_id, email, code);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setLoyaltySessionCookie(result.token);

  return NextResponse.json({ ok: true });
}
