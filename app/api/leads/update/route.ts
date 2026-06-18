export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum(["novo", "cotacao_enviada", "negociando", "reservado", "perdido"]).optional(),
  lost_reason: z.string().max(500).optional(),
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

  const { lead_id, status, lost_reason } = parsed.data;
  const service = createServiceClient();

  const { data: lead } = await service.from("leads").select("tenant_id").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", lead.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_staff", "tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (lost_reason !== undefined) update.lost_reason = lost_reason || null;

  const { error } = await service.from("leads").update(update).eq("id", lead_id);
  if (error) return NextResponse.json({ error: "Erro ao atualizar lead." }, { status: 500 });

  await writeAuditLog({
    tenant_id: lead.tenant_id,
    user_id: user.id,
    action: "lead.update",
    resource: "leads",
    resource_id: lead_id,
    ip_address: getClientIp(req),
    metadata: update,
  });

  return NextResponse.json({ ok: true });
}
