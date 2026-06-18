export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { hashBackupCode } from "@/lib/mfa/backup-codes";

const schema = z.object({ code: z.string().min(1) });

// Consumes a single-use MFA backup code as a recovery path when the user's TOTP
// device is unavailable. A successful call here does not natively elevate the
// Supabase Auth session to AAL2 (that only happens via auth.mfa.verify) — callers
// that gate on AAL2 (see requireAal2ForSuperAdmin in lib/auth/super-admin.ts) treat
// a backup code consumed within the last few minutes as an AAL2-equivalent for
// this user. Ultimate recovery if both the device and all codes are lost is
// removing the factor directly in Supabase Studio (auth.mfa_factors).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const ip = getClientIp(req) ?? "unknown";
  const limit = await enforceRateLimit({ key: `mfa-backup-verify:${user.id}:${ip}`, limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const service = createServiceClient();
  const codeHash = hashBackupCode(parsed.data.code);

  const { data: backupCode } = await service
    .from("mfa_backup_codes")
    .select("id")
    .eq("user_id", user.id)
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .maybeSingle();

  if (!backupCode) {
    await writeAuditLog({
      user_id: user.id,
      action: "auth.mfa_backup_failed",
      resource: "mfa_backup_codes",
      ip_address: ip,
    });
    return NextResponse.json({ error: "Código de backup inválido ou já utilizado." }, { status: 401 });
  }

  await service.from("mfa_backup_codes").update({ used_at: new Date().toISOString() }).eq("id", backupCode.id);

  await writeAuditLog({
    user_id: user.id,
    action: "auth.mfa_backup_used",
    resource: "mfa_backup_codes",
    resource_id: backupCode.id,
    ip_address: ip,
  });

  return NextResponse.json({ ok: true });
}
