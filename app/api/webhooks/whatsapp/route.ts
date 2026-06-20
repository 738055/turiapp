export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordInboundMessage, updateMessageStatus } from "@/lib/conversations/store";
import { verifyWhatsappWebhookToken } from "@/lib/whatsapp/webhook-auth";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/360dialog";
import { sendPushToUsers } from "@/lib/push/send";
import { decrypt } from "@/lib/crypto";

// Receives inbound WhatsApp messages forwarded by 360dialog (WhatsApp Cloud API
// webhook format). The tenant is identified by ?tenant=<slug> — the tenant pastes
// this URL into the 360dialog dashboard. We store each message and bump the
// conversation. Always returns 200 fast (the provider retries on non-200).

// Some setups send a GET verification (hub.challenge). Echo it back.
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ ok: true });
}

type WaMedia = { id?: string; caption?: string; mime_type?: string; filename?: string };
type WaMessage = {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } };
  image?: WaMedia;
  document?: WaMedia;
  video?: WaMedia;
  audio?: WaMedia;
  sticker?: WaMedia;
};
interface WaValue {
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: WaMessage[];
  statuses?: { id?: string; status?: string }[];
}

function bodyOf(m: WaMessage): string | null {
  if (m.type === "text") return m.text?.body ?? null;
  if (m.type === "button") return m.button?.text ?? null;
  if (m.type === "interactive") return m.interactive?.list_reply?.title ?? m.interactive?.button_reply?.title ?? null;
  return null;
}

function mediaOf(m: WaMessage): { id: string; caption: string | null } | null {
  const md = m.image ?? m.document ?? m.video ?? m.audio ?? m.sticker;
  return md?.id ? { id: md.id, caption: md.caption ?? null } : null;
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("tenant") ?? req.headers.get("x-tenant-slug");
  if (!slug) return NextResponse.json({ received: true });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ received: true });

  const service = createServiceClient();
  const { data: tenant } = await service.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (!tenant) return NextResponse.json({ received: true });

  // Autenticação: só processa se o token bater (evita injeção de mensagens
  // falsas por quem conhece o slug). Responde 200 mesmo se errado, para não dar
  // feedback a um atacante e não fazer o provedor reentregar em loop.
  const token = req.nextUrl.searchParams.get("token");
  if (!verifyWhatsappWebhookToken(tenant.id, token)) {
    console.error(JSON.stringify({ level: "warn", scope: "webhook.whatsapp.bad_token", tenant_id: tenant.id }));
    return NextResponse.json({ received: true });
  }

  // Destinatários do push (dono/admin/atendimento do tenant), carregados uma vez.
  const { data: members } = await service.from("tenant_members").select("user_id").eq("tenant_id", tenant.id);
  const recipientIds = (members ?? []).map((m) => m.user_id as string);

  // Chave do WhatsApp do tenant (para baixar mídias recebidas), uma vez.
  const { data: integ } = await service
    .from("tenant_integrations")
    .select("whatsapp_status, whatsapp_api_key_encrypted")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  let apiKey: string | null = null;
  try {
    if (integ?.whatsapp_status === "connected" && integ.whatsapp_api_key_encrypted) apiKey = decrypt(integ.whatsapp_api_key_encrypted);
  } catch { /* sem chave → sem download de mídia */ }

  try {
    const entries = (payload.entry ?? []) as { changes?: { value?: WaValue }[] }[];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // Status de entrega/leitura das mensagens que ENVIAMOS (✓ ✓✓).
        for (const s of value?.statuses ?? []) {
          if (s.id && s.status) await updateMessageStatus(service, tenant.id, s.id, s.status);
        }

        if (!value?.messages?.length) continue;

        const names = new Map<string, string>();
        for (const c of value.contacts ?? []) {
          if (c.wa_id && c.profile?.name) names.set(c.wa_id, c.profile.name);
        }

        for (const m of value.messages) {
          if (!m.from) continue;
          const contactName = names.get(m.from) ?? null;

          // Mídia recebida: baixa do 360dialog e re-hospeda no bucket público.
          let mediaUrl: string | null = null;
          const media = mediaOf(m);
          if (media && apiKey) {
            const dl = await downloadWhatsAppMedia(apiKey, media.id);
            if (dl) {
              const ext = ((dl.contentType.split("/")[1] ?? "bin").split(";")[0]).replace("jpeg", "jpg");
              const path = `${tenant.id}/whatsapp/${m.id ?? media.id}.${ext}`;
              const up = await service.storage.from("media").upload(path, dl.bytes, { contentType: dl.contentType, upsert: true });
              if (!up.error) mediaUrl = service.storage.from("media").getPublicUrl(path).data.publicUrl;
            }
          }

          const body = media ? media.caption : bodyOf(m);
          const convId = await recordInboundMessage(service, tenant.id, {
            phone: m.from, contactName, waMessageId: m.id ?? null, body, type: m.type ?? "text", mediaUrl,
          });
          // Push nativo só para mensagens NOVAS (convId != null = não-duplicada).
          if (convId && recipientIds.length) {
            sendPushToUsers(recipientIds, {
              title: `Nova mensagem — ${contactName || m.from}`,
              body: body ? body.slice(0, 120) : media ? "Enviou uma mídia 📎" : "Enviou uma mensagem",
              url: `/conversas?c=${convId}`,
            }).catch(() => {});
          }
        }
      }
    }
  } catch {
    // Never fail the webhook — provider would retry forever.
  }

  return NextResponse.json({ received: true });
}
