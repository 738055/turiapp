import type { createServiceClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/whatsapp/360dialog";

type Service = ReturnType<typeof createServiceClient>;

function preview(body: string | null | undefined, fallback = "[mídia]"): string {
  return (body && body.trim() ? body : fallback).slice(0, 140);
}

export interface InboundMessage {
  phone: string;
  contactName?: string | null;
  waMessageId?: string | null;
  body?: string | null;
  type?: string;
}

/**
 * Records an inbound WhatsApp message: finds/creates the conversation (linking to
 * an existing customer by phone when possible — we never auto-create customers
 * because email is required), inserts the message (deduped by wa_message_id) and
 * bumps the conversation (unread + last_inbound_at, used for the 24h window).
 * Returns the conversation id, or null if it was a duplicate / failed.
 */
export async function recordInboundMessage(service: Service, tenantId: string, msg: InboundMessage): Promise<string | null> {
  const phone = normalizePhone(msg.phone);
  if (!phone) return null;

  let { data: conv } = await service
    .from("conversations")
    .select("id, unread_count")
    .eq("tenant_id", tenantId)
    .eq("channel", "whatsapp")
    .eq("phone", phone)
    .maybeSingle();

  if (!conv) {
    const { data: customer } = await service
      .from("customers")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("phone", phone)
      .maybeSingle();
    const { data: created } = await service
      .from("conversations")
      .insert({
        tenant_id: tenantId,
        channel: "whatsapp",
        phone,
        contact_name: msg.contactName || customer?.name || phone,
        customer_id: customer?.id ?? null,
      })
      .select("id, unread_count")
      .single();
    conv = created;
  }
  if (!conv) return null;

  const { error } = await service.from("messages").insert({
    conversation_id: conv.id,
    tenant_id: tenantId,
    direction: "inbound",
    type: msg.type ?? "text",
    body: msg.body ?? null,
    wa_message_id: msg.waMessageId ?? null,
  });
  // Duplicate delivery (unique on wa_message_id) — already processed.
  if (error) return error.code === "23505" ? null : null;

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    last_message_at: now,
    last_inbound_at: now,
    last_message_preview: preview(msg.body),
    unread_count: (conv.unread_count ?? 0) + 1,
    updated_at: now,
  };
  if (msg.contactName) update.contact_name = msg.contactName;
  await service.from("conversations").update(update).eq("id", conv.id);

  return conv.id;
}

export interface OutboundMessage {
  body?: string | null;
  type?: string;
  waMessageId?: string | null;
  senderUserId?: string | null;
  status?: "sent" | "delivered" | "read" | "failed";
}

/** Records a message sent by an agent and updates the conversation. */
export async function recordOutboundMessage(service: Service, tenantId: string, conversationId: string, msg: OutboundMessage): Promise<void> {
  await service.from("messages").insert({
    conversation_id: conversationId,
    tenant_id: tenantId,
    direction: "outbound",
    type: msg.type ?? "text",
    body: msg.body ?? null,
    wa_message_id: msg.waMessageId ?? null,
    sender_user_id: msg.senderUserId ?? null,
    status: msg.status ?? "sent",
  });

  const now = new Date().toISOString();
  await service
    .from("conversations")
    .update({ last_message_at: now, last_message_preview: preview(msg.body, "[template]"), status: "open", updated_at: now })
    .eq("id", conversationId);
}

const STATUS_RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

/**
 * Atualiza o status de entrega de uma mensagem enviada (sent → delivered → read,
 * ou failed) a partir dos eventos `statuses` do webhook. Só "sobe" o status —
 * eventos fora de ordem não regridem read→delivered. `failed` sempre vence.
 */
export async function updateMessageStatus(service: Service, tenantId: string, waMessageId: string, status: string): Promise<void> {
  if (!STATUS_RANK[status]) return;
  const { data: msg } = await service
    .from("messages")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("wa_message_id", waMessageId)
    .maybeSingle();
  if (!msg) return;

  const current = msg.status ? STATUS_RANK[msg.status] ?? 0 : 0;
  const next = STATUS_RANK[status];
  if (status !== "failed" && next <= current) return;

  await service.from("messages").update({ status }).eq("id", msg.id);
}
