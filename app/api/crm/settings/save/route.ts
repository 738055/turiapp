export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  tier_prata_min: z.coerce.number().min(0),
  tier_ouro_min: z.coerce.number().min(0),
  tier_vip_min: z.coerce.number().min(0),
  risk_days: z.coerce.number().int().min(1).max(3650),
  lost_days: z.coerce.number().int().min(1).max(3650),
  new_days: z.coerce.number().int().min(0).max(3650),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.issues }, { status: 400 });
  }

  const { tenant_id, ...fields } = parsed.data;

  if (fields.tier_ouro_min < fields.tier_prata_min || fields.tier_vip_min < fields.tier_ouro_min) {
    return NextResponse.json({ error: "As faixas de valor devem ser crescentes: Prata ≤ Ouro ≤ VIP." }, { status: 400 });
  }
  if (fields.risk_days >= fields.lost_days) {
    return NextResponse.json({ error: "\"Em risco\" deve ser menor que \"Perdido\" (em dias)." }, { status: 400 });
  }

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

  const { error } = await service
    .from("crm_settings")
    .upsert({ tenant_id, ...fields }, { onConflict: "tenant_id" });

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar configurações de CRM." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "crm_settings.update",
    resource: "crm_settings",
    resource_id: tenant_id,
    metadata: fields,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
