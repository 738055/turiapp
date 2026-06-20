export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

const schema = z.object({
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["open", "closed"]).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, conversation_id, assigned_to, status, tags } = parsed.data;

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();
  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (!(await tenantHasProFeature(service, tenant_id))) {
    return NextResponse.json({ error: proFeatureError("support") }, { status: 403 });
  }

  // If assigning, the assignee must be a member of this tenant.
  if (assigned_to) {
    const { data: assignee } = await service
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenant_id)
      .eq("user_id", assigned_to)
      .maybeSingle();
    if (!assignee) return NextResponse.json({ error: "Atendente inválido." }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (assigned_to !== undefined) update.assigned_to = assigned_to;
  if (status !== undefined) update.status = status;
  if (tags !== undefined) update.tags = tags;

  const { error } = await service
    .from("conversations")
    .update(update)
    .eq("id", conversation_id)
    .eq("tenant_id", tenant_id);

  if (error) return NextResponse.json({ error: "Erro ao atualizar conversa." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
