export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { decrypt } from "@/lib/crypto";
import { sendWhatsAppText, sendWhatsAppTemplate, sendWhatsAppMedia, normalizePhone } from "@/lib/whatsapp/360dialog";
import { getWhatsAppTemplate } from "@/lib/whatsapp/templates";
import { recordOutboundMessage } from "@/lib/conversations/store";
import { checkWhatsAppCircuit, tripWhatsAppCircuit } from "@/lib/whatsapp/circuit-breaker";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

const WINDOW_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  body: z.string().max(4096).optional(),
  // Midia por link; body vira legenda quando o tipo aceitar.
  media_url: z.string().url().optional(),
  media_type: z.enum(["image", "document", "audio", "video"]).optional(),
  filename: z.string().max(255).optional(),
  // Modelo "legado" (hardcoded em lib/whatsapp/templates).
  template_key: z.string().optional(),
  params: z.record(z.string(), z.string()).default({}),
  // Modelo dinâmico puxado do 360dialog (nome + idioma + variáveis posicionais).
  template_name: z.string().optional(),
  template_language: z.string().optional(),
  template_params: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, conversation_id, body, media_url, media_type, filename, template_key, params, template_name, template_language, template_params } = parsed.data;

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

  const { data: conversation } = await service
    .from("conversations")
    .select("id, phone, last_inbound_at")
    .eq("id", conversation_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const { data: integrations } = await service
    .from("tenant_integrations")
    .select("whatsapp_status, whatsapp_api_key_encrypted")
    .eq("tenant_id", tenant_id)
    .single();
  if (!integrations || integrations.whatsapp_status !== "connected" || !integrations.whatsapp_api_key_encrypted) {
    return NextResponse.json({ error: "WhatsApp não conectado. Conecte em Integrações." }, { status: 400 });
  }

  // Circuit breaker (mesma proteção do envio em massa).
  const circuit = await checkWhatsAppCircuit(service, tenant_id);
  if (!circuit.allowed) {
    await tripWhatsAppCircuit(service, tenant_id, circuit.count);
    return NextResponse.json({ error: "Limite de segurança de envios atingido nesta hora." }, { status: 429 });
  }

  const lastInbound = conversation.last_inbound_at ? new Date(conversation.last_inbound_at).getTime() : 0;
  const withinWindow = lastInbound > 0 && Date.now() - lastInbound < WINDOW_MS;
  const to = normalizePhone(conversation.phone);
  const apiKey = decrypt(integrations.whatsapp_api_key_encrypted);

  try {
    if (withinWindow && media_url) {
      // Midia por link, so dentro da janela de 24h.
      const kind = media_type ?? "image";
      const trimmedBody = body?.trim() || undefined;
      const res = await sendWhatsAppMedia({ apiKey, to, type: kind, link: media_url, caption: trimmedBody, filename });
      await recordOutboundMessage(service, tenant_id, conversation_id, {
        body: kind === "audio" ? null : trimmedBody ?? null, type: kind, mediaUrl: media_url, waMessageId: res.messageId ?? null, senderUserId: user.id, status: "sent",
      });
      if (kind === "audio" && trimmedBody) {
        const textRes = await sendWhatsAppText({ apiKey, to, body: trimmedBody });
        await recordOutboundMessage(service, tenant_id, conversation_id, {
          body: trimmedBody, type: "text", waMessageId: textRes.messageId ?? null, senderUserId: user.id, status: "sent",
        });
      }
    } else if (withinWindow && body && body.trim()) {
      // Texto livre permitido.
      const res = await sendWhatsAppText({ apiKey, to, body: body.trim() });
      await recordOutboundMessage(service, tenant_id, conversation_id, {
        body: body.trim(), type: "text", waMessageId: res.messageId ?? null, senderUserId: user.id, status: "sent",
      });
    } else if (template_name) {
      // Modelo dinâmico puxado do 360dialog (nome + idioma + variáveis posicionais).
      const res = await sendWhatsAppTemplate({
        apiKey, to, templateName: template_name, language: template_language || "pt_BR", params: template_params ?? [],
      });
      await recordOutboundMessage(service, tenant_id, conversation_id, {
        body: `[modelo] ${template_name}`, type: "template", waMessageId: res.messageId ?? null, senderUserId: user.id, status: "sent",
      });
      await service.from("whatsapp_logs").insert({ tenant_id, phone: to, template: template_name, status: "sent" });
    } else if (template_key) {
      // Modelo legado (hardcoded).
      const template = getWhatsAppTemplate(template_key);
      if (!template) return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
      const orderedParams = template.paramKeys.map((k) => params[k] ?? "");
      const res = await sendWhatsAppTemplate({ apiKey, to, templateName: template.metaName, language: template.language, params: orderedParams });
      await recordOutboundMessage(service, tenant_id, conversation_id, {
        body: `[modelo] ${template.label ?? template_key}`, type: "template", waMessageId: res.messageId ?? null, senderUserId: user.id, status: "sent",
      });
      await service.from("whatsapp_logs").insert({ tenant_id, phone: to, template: template_key, status: "sent" });
    } else {
      return NextResponse.json(
        { error: "Fora da janela de 24h: só é possível enviar um modelo (template) aprovado.", needsTemplate: true },
        { status: 409 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Erro ao enviar a mensagem. Tente novamente." }, { status: 502 });
  }

  await writeAuditLog({
    tenant_id, user_id: user.id, action: "conversation.reply", resource: "messages",
    resource_id: conversation_id, ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
