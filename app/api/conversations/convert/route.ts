export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

// Turn a conversation contact into a CRM record. Customers and leads both require
// an email (schema), which a WhatsApp contact doesn't have — so the agent fills
// it in. The new record is linked back to the conversation.
const schema = z.object({
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  target: z.enum(["customer", "lead"]),
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe nome e e-mail válidos." }, { status: 400 });
  const { tenant_id, conversation_id, target, name, email, phone } = parsed.data;

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
    return NextResponse.json({ error: proFeatureError("crm") }, { status: 403 });
  }

  const { data: conversation } = await service
    .from("conversations")
    .select("id, phone")
    .eq("id", conversation_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const contactPhone = phone || (conversation.phone as string) || null;

  if (target === "customer") {
    const { data: customer, error } = await service
      .from("customers")
      .upsert(
        { tenant_id, name, email: email.toLowerCase(), phone: contactPhone },
        { onConflict: "tenant_id,email", ignoreDuplicates: false }
      )
      .select("id")
      .single();
    if (error || !customer) return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 });

    await service.from("conversations").update({ customer_id: customer.id, updated_at: new Date().toISOString() }).eq("id", conversation_id);
    await writeAuditLog({ tenant_id, user_id: user.id, action: "conversation.to_customer", resource: "customers", resource_id: customer.id, ip_address: getClientIp(req) });
    return NextResponse.json({ ok: true, customer_id: customer.id });
  }

  // target === "lead"
  const { data: lead, error } = await service
    .from("leads")
    .insert({ tenant_id, name, email: email.toLowerCase(), phone: contactPhone, source: "manual", status: "novo", message: "Criado a partir de uma conversa do WhatsApp." })
    .select("id")
    .single();
  if (error || !lead) return NextResponse.json({ error: "Erro ao criar lead." }, { status: 500 });

  await service.from("conversations").update({ lead_id: lead.id, updated_at: new Date().toISOString() }).eq("id", conversation_id);
  await writeAuditLog({ tenant_id, user_id: user.id, action: "conversation.to_lead", resource: "leads", resource_id: lead.id, ip_address: getClientIp(req) });
  return NextResponse.json({ ok: true, lead_id: lead.id });
}
