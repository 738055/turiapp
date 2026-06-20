export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { getPlanTier } from "@/lib/plans/limits";
import { automationActionAllowed, automationActionGateMessage } from "@/lib/automations/access";

const triggerTypes = [
  "booking_confirmed",
  "checkin_in_days",
  "checkout_days_ago",
  "customer_inactive_days",
  "lead_no_response_days",
  "quote_expiring_soon",
] as const;

const actionTypes = ["send_email", "send_whatsapp", "internal_notification", "move_lead_status"] as const;

const schema = z.object({
  automation_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  trigger_type: z.enum(triggerTypes),
  trigger_config: z.record(z.string(), z.unknown()).default({}),
  action_type: z.enum(actionTypes),
  action_config: z.record(z.string(), z.unknown()).default({}),
  delay_hours: z.coerce.number().int().min(0).max(720).default(0),
  active: z.boolean().default(true),
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

  const { automation_id, tenant_id, name, trigger_type, trigger_config, action_type, action_config, delay_hours, active } =
    parsed.data;

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

  const planTier = await getPlanTier(service, tenant_id);
  if (!automationActionAllowed(action_type, planTier)) {
    return NextResponse.json(
      { error: automationActionGateMessage(action_type) ?? "Esta acao nao esta incluida no seu plano." },
      { status: 403 }
    );
  }

  const row = {
    tenant_id,
    name,
    trigger_type,
    trigger_config,
    action_type,
    action_config,
    delay_hours,
    active,
  };

  const { data: saved, error } = automation_id
    ? await service.from("automations").update(row).eq("id", automation_id).eq("tenant_id", tenant_id).select("id").single()
    : await service.from("automations").insert(row).select("id").single();

  if (error || !saved) {
    return NextResponse.json({ error: "Erro ao salvar automação." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: automation_id ? "automation.update" : "automation.create",
    resource: "automations",
    resource_id: saved.id,
    ip_address: getClientIp(req),
    metadata: { name, trigger_type, action_type },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
