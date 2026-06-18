export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { generateBackupCodes, hashBackupCode } from "@/lib/mfa/backup-codes";

// Generates a fresh set of 10 single-use backup codes for the authenticated user,
// invalidating any previously issued codes. Only SHA-256 hashes are persisted —
// the plaintext codes are returned once in this response and never stored.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const limit = rateLimit({ key: `mfa-backup-gen:${user.id}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde e tente novamente." }, { status: 429 });
  }

  const service = createServiceClient();

  // Regenerating invalidates everything issued before.
  await service.from("mfa_backup_codes").delete().eq("user_id", user.id);

  const codes = generateBackupCodes();
  const rows = codes.map((code) => ({ user_id: user.id, code_hash: hashBackupCode(code) }));

  const { error } = await service.from("mfa_backup_codes").insert(rows);
  if (error) {
    return NextResponse.json({ error: "Erro ao gerar códigos de backup." }, { status: 500 });
  }

  await writeAuditLog({
    user_id: user.id,
    action: "auth.mfa_backup_codes_generated",
    resource: "mfa_backup_codes",
    ip_address: getClientIp(req),
    metadata: { count: codes.length },
  });

  return NextResponse.json({ codes });
}
