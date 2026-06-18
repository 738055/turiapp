export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  member_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, member_id } = parsed.data;

  const service = createServiceClient();

  // Only owners can remove members.
  const { data: caller } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!caller || !roleAtLeast(caller.role, "tenant_owner")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: target } = await service
    .from("tenant_members")
    .select("id, user_id, role")
    .eq("id", member_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!target) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });

  // An owner can never be removed (keeps the tenant always reachable), and you
  // cannot remove yourself through this UI.
  if (target.role === "tenant_owner" || target.role === "owner" || target.role === "super_admin") {
    return NextResponse.json({ error: "Não é possível remover o proprietário da conta." }, { status: 403 });
  }
  if (target.user_id === user.id) {
    return NextResponse.json({ error: "Você não pode remover a si mesmo." }, { status: 403 });
  }

  const { error } = await service
    .from("tenant_members")
    .delete()
    .eq("id", member_id)
    .eq("tenant_id", tenant_id);

  if (error) return NextResponse.json({ error: "Erro ao remover membro." }, { status: 500 });

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "team.member_removed",
    resource: "tenant_members",
    resource_id: member_id,
    ip_address: getClientIp(req),
    metadata: { removed_user: target.user_id, role: target.role },
  });

  return NextResponse.json({ ok: true });
}
