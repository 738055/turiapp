export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestLoyaltyLoginCode } from "@/lib/loyalty/auth";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { sendEmail, renderLoyaltyCodeEmailHtml } from "@/lib/email/resend";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { tenant_id, email } = parsed.data;
  const ip = getClientIp(req) ?? "unknown";

  const rl = await enforceRateLimit({ key: `loyalty-login:${tenant_id}:${email}`, limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }
  const ipRl = await enforceRateLimit({ key: `loyalty-login-ip:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!ipRl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const code = await requestLoyaltyLoginCode(tenant_id, email);

  if (code) {
    const service = createServiceClient();
    const [{ data: tenant }, { data: theme }] = await Promise.all([
      service.from("tenants").select("name, slug").eq("id", tenant_id).single(),
      service.from("themes").select("primary_color").eq("tenant_id", tenant_id).maybeSingle(),
    ]);

    if (tenant) {
      await sendEmail({
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        to: email,
        subject: `${code} é o seu código de acesso`,
        html: renderLoyaltyCodeEmailHtml({ code, tenantName: tenant.name, primaryColor: theme?.primary_color ?? undefined }),
      });
    }
  }

  // Always return a generic success message — avoids leaking whether the email is registered.
  return NextResponse.json({ ok: true });
}
