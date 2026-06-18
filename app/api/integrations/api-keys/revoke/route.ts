export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  key_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { key_id, tenant_id } = parsed.data;
  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await service
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", key_id)
    .eq("tenant_id", tenant_id);

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "api_key.revoke",
    resource: "api_keys",
    resource_id: key_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
