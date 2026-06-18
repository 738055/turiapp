export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { sendWhatsAppTemplate, normalizePhone } from "@/lib/whatsapp/360dialog";
import { getWhatsAppTemplate } from "@/lib/whatsapp/templates";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { checkWhatsAppCircuit, tripWhatsAppCircuit } from "@/lib/whatsapp/circuit-breaker";

const schema = z.object({
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  phone: z.string().min(8),
  template_key: z.string(),
  params: z.record(z.string(), z.string()).default({}),
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

  const { tenant_id, customer_id, phone, template_key, params } = parsed.data;
  const template = getWhatsAppTemplate(template_key);
  if (!template) {
    return NextResponse.json({ error: "Template inválido." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_staff", "tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: integrations } = await service
    .from("tenant_integrations")
    .select("whatsapp_status, whatsapp_api_key_encrypted")
    .eq("tenant_id", tenant_id)
    .single();

  if (!integrations || integrations.whatsapp_status !== "connected" || !integrations.whatsapp_api_key_encrypted) {
    return NextResponse.json({ error: "WhatsApp Business API não conectado." }, { status: 400 });
  }

  // Circuit breaker: stop abnormal bursts (compromised account / runaway loop)
  // before they get the tenant's number banned by Meta.
  const circuit = await checkWhatsAppCircuit(service, tenant_id);
  if (!circuit.allowed) {
    await tripWhatsAppCircuit(service, tenant_id, circuit.count);
    return NextResponse.json(
      { error: "Limite de segurança de envios de WhatsApp atingido nesta hora. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const normalizedPhone = normalizePhone(phone);
  const orderedParams = template.paramKeys.map((key) => params[key] ?? "");

  try {
    const apiKey = decrypt(integrations.whatsapp_api_key_encrypted);
    await sendWhatsAppTemplate({
      apiKey,
      to: normalizedPhone,
      templateName: template.metaName,
      language: template.language,
      params: orderedParams,
    });

    await service.from("whatsapp_logs").insert({
      tenant_id,
      customer_id: customer_id ?? null,
      phone: normalizedPhone,
      template: template_key,
      status: "sent",
    });

    await writeAuditLog({
      tenant_id,
      user_id: user.id,
      action: "whatsapp.send_manual",
      resource: "whatsapp_logs",
      ip_address: getClientIp(req),
      metadata: { template: template_key, phone: normalizedPhone },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await service.from("whatsapp_logs").insert({
      tenant_id,
      customer_id: customer_id ?? null,
      phone: normalizedPhone,
      template: template_key,
      status: "failed",
      error: err instanceof Error ? err.message : "Erro desconhecido",
    });

    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
