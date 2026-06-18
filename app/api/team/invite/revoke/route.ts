export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  invite_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, invite_id } = parsed.data;

  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !roleAtLeast(membership.role, "tenant_admin")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invite_id)
    .eq("tenant_id", tenant_id)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (error) return NextResponse.json({ error: "Erro ao revogar convite." }, { status: 500 });

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "team.invite_revoked",
    resource: "invites",
    resource_id: invite_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
