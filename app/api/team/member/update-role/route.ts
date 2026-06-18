export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { assignableRoles } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  member_id: z.string().uuid(),
  role: z.enum(["tenant_admin", "tenant_staff"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, member_id, role } = parsed.data;

  const service = createServiceClient();

  // Caller must be a member; only owners can change roles.
  const { data: caller } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!caller) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!assignableRoles(caller.role).includes(role)) {
    return NextResponse.json({ error: "Sem permissão para definir este nível de acesso." }, { status: 403 });
  }

  // Target must belong to the same tenant. Never touch an owner or super_admin
  // row through this path — owner transfer is intentionally out of scope.
  const { data: target } = await service
    .from("tenant_members")
    .select("id, user_id, role")
    .eq("id", member_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!target) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
  if (target.role === "tenant_owner" || target.role === "owner" || target.role === "super_admin") {
    return NextResponse.json({ error: "Não é possível alterar o nível deste membro." }, { status: 403 });
  }
  if (target.user_id === user.id) {
    return NextResponse.json({ error: "Você não pode alterar seu próprio nível de acesso." }, { status: 403 });
  }

  const { error } = await service
    .from("tenant_members")
    .update({ role })
    .eq("id", member_id)
    .eq("tenant_id", tenant_id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar acesso." }, { status: 500 });

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "team.member_role_changed",
    resource: "tenant_members",
    resource_id: member_id,
    ip_address: getClientIp(req),
    metadata: { from: target.role, to: role, target_user: target.user_id },
  });

  return NextResponse.json({ ok: true });
}
