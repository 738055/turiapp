export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Composite limit: per-IP (broad brute force) and per-email (targeted credential
  // stuffing against one account, even if spread across many IPs).
  const [ipLimit, emailLimit] = await Promise.all([
    enforceRateLimit({ key: `login:ip:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 }),
    enforceRateLimit({ key: `login:email:${email.toLowerCase()}`, limit: 5, windowMs: 15 * 60 * 1000 }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    await writeAuditLog({
      action: "auth.login_rate_limited",
      resource: "auth.users",
      ip_address: ip,
      metadata: { email },
    });
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: getRateLimitHeaders(ipLimit.allowed ? emailLimit : ipLimit) }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await writeAuditLog({
      action: "auth.login_failed",
      resource: "auth.users",
      ip_address: ip,
      metadata: { email },
    });
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await writeAuditLog({
    user_id: data.user.id,
    action: "auth.login_success",
    resource: "auth.users",
    resource_id: data.user.id,
    ip_address: ip,
  });

  // Super admins have no tenant_members row, so /dashboard (gated by tenant
  // membership) would dead-end back to /login — send them to /admin instead.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_super_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    redirectTo: profile?.is_super_admin ? "/admin" : "/dashboard",
  });
}
