export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordInboundMessage, updateMessageStatus } from "@/lib/conversations/store";
import { verifyWhatsappWebhookToken } from "@/lib/whatsapp/webhook-auth";
import { sendPushToUsers } from "@/lib/push/send";

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

interface WaValue {
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: {
    from?: string;
    id?: string;
    type?: string;
    text?: { body?: string };
    button?: { text?: string };
    interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } };
  }[];
  statuses?: { id?: string; status?: string }[];
}

function bodyOf(m: NonNullable<WaValue["messages"]>[number]): string | null {
  if (m.type === "text") return m.text?.body ?? null;
  if (m.type === "button") return m.button?.text ?? null;
  if (m.type === "interactive") return m.interactive?.list_reply?.title ?? m.interactive?.button_reply?.title ?? null;
  return null; // image/audio/document/etc — stored as type only
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
          const body = bodyOf(m);
          const convId = await recordInboundMessage(service, tenant.id, {
            phone: m.from, contactName, waMessageId: m.id ?? null, body, type: m.type ?? "text",
          });
          // Push nativo só para mensagens NOVAS (convId != null = não-duplicada).
          if (convId && recipientIds.length) {
            sendPushToUsers(recipientIds, {
              title: `Nova mensagem — ${contactName || m.from}`,
              body: body ? body.slice(0, 120) : "Enviou uma mídia",
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
