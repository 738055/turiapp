export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  automation_id: z.string().uuid(),
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

  const { automation_id } = parsed.data;
  const service = createServiceClient();

  const { data: automation } = await service.from("automations").select("tenant_id, name").eq("id", automation_id).single();
  if (!automation) return NextResponse.json({ error: "Automação não encontrada." }, { status: 404 });

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", automation.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service.from("automations").delete().eq("id", automation_id);
  if (error) return NextResponse.json({ error: "Erro ao excluir automação." }, { status: 500 });

  await writeAuditLog({
    tenant_id: automation.tenant_id,
    user_id: user.id,
    action: "automation.delete",
    resource: "automations",
    resource_id: automation_id,
    ip_address: getClientIp(req),
    metadata: { name: automation.name },
  });

  return NextResponse.json({ ok: true });
}
