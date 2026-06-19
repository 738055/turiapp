export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  const conversationId = req.nextUrl.searchParams.get("conversation_id");
  if (!tenantId || !conversationId) {
    return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: conversation } = await service
    .from("conversations")
    .select("id, customer_id, lead_id, phone, contact_name, last_inbound_at, status, tags, assigned_to")
    .eq("id", conversationId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const { data: messages } = await service
    .from("messages")
    .select("id, direction, type, body, status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);

  // Opening the thread clears the unread badge.
  await service.from("conversations").update({ unread_count: 0 }).eq("id", conversationId);

  // 24h window (Meta): free-form text only while the customer's last message is
  // under 24h old.
  const lastInbound = conversation.last_inbound_at ? new Date(conversation.last_inbound_at).getTime() : 0;
  const withinWindow = lastInbound > 0 && Date.now() - lastInbound < WINDOW_MS;

  // Tourism context: if the contact is a known customer, surface their recent
  // bookings so the agent sees who they're talking to.
  let customer: { id: string; name: string; email: string } | null = null;
  let bookings: { id: string; status: string; total_price: number; currency: string; created_at: string; productTitle: string }[] = [];
  if (conversation.customer_id) {
    const [{ data: c }, { data: b }] = await Promise.all([
      service.from("customers").select("id, name, email").eq("id", conversation.customer_id).maybeSingle(),
      service
        .from("bookings")
        .select("id, status, total_price, currency, created_at, products(title)")
        .eq("customer_id", conversation.customer_id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    customer = c ?? null;
    bookings = (b ?? []).map((bk) => ({
      id: bk.id as string,
      status: bk.status as string,
      total_price: bk.total_price as number,
      currency: (bk.currency as string) ?? "BRL",
      created_at: bk.created_at as string,
      productTitle: (bk.products as unknown as { title: string } | null)?.title ?? "Produto",
    }));
  }

  // Internal notes (team-only) with the author's name.
  const { data: rawNotes } = await service
    .from("conversation_notes")
    .select("id, body, user_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  const notes = await Promise.all(
    (rawNotes ?? []).map(async (n) => {
      let author = "—";
      if (n.user_id) {
        const { data: prof } = await service.from("user_profiles").select("full_name").eq("id", n.user_id).maybeSingle();
        if (prof?.full_name) author = prof.full_name;
        else {
          const { data: au } = await service.auth.admin.getUserById(n.user_id);
          author = au?.user?.email ?? "—";
        }
      }
      return { id: n.id, body: n.body, author, created_at: n.created_at };
    })
  );

  // Linked lead (if any) for the "abrir lead" shortcut.
  let lead: { id: string; status: string } | null = null;
  if (conversation.lead_id) {
    const { data: l } = await service.from("leads").select("id, status").eq("id", conversation.lead_id).maybeSingle();
    lead = l ?? null;
  }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      phone: conversation.phone,
      contact_name: conversation.contact_name,
      customer_id: conversation.customer_id,
      lead_id: conversation.lead_id,
      status: conversation.status,
      tags: conversation.tags ?? [],
      assigned_to: conversation.assigned_to,
    },
    messages: messages ?? [],
    withinWindow,
    customer,
    bookings,
    notes,
    lead,
  });
}
