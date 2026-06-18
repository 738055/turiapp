export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { enforceRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

// Always returns the same generic response, win or lose, to avoid leaking
// which emails exist in the base (anti-enumeration).
const GENERIC_RESPONSE = {
  ok: true,
  message: "Se este e-mail existir em nossa base, enviamos um link de recuperação.",
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const limit = await enforceRateLimit({ key: `reset-request:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Don't reveal validation specifics either — same generic response.
    return NextResponse.json(GENERIC_RESPONSE, { headers: getRateLimitHeaders(limit) });
  }

  const { email } = parsed.data;
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/nova-senha`,
  });

  await writeAuditLog({
    action: "auth.reset_request",
    resource: "auth.users",
    ip_address: ip,
    metadata: { email, supabase_error: error ? error.message : null },
  });

  return NextResponse.json(GENERIC_RESPONSE, { headers: getRateLimitHeaders(limit) });
}
