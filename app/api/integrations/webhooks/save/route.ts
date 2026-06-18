export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { encrypt, generateToken } from "@/lib/crypto";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/events";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  endpoint_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1),
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

  const { endpoint_id, tenant_id, url, events, active } = parsed.data;
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

  if (endpoint_id) {
    const { error } = await service
      .from("webhook_endpoints")
      .update({ url, events, active })
      .eq("id", endpoint_id)
      .eq("tenant_id", tenant_id);

    if (error) return NextResponse.json({ error: "Erro ao salvar webhook." }, { status: 500 });

    await writeAuditLog({
      tenant_id,
      user_id: user.id,
      action: "webhook_endpoint.update",
      resource: "webhook_endpoints",
      resource_id: endpoint_id,
      ip_address: getClientIp(req),
      metadata: { url, events },
    });

    return NextResponse.json({ ok: true, id: endpoint_id });
  }

  const secret = `whsec_${generateToken(24)}`;
  const { data: saved, error } = await service
    .from("webhook_endpoints")
    .insert({ tenant_id, url, events, active, secret_encrypted: encrypt(secret) })
    .select("id")
    .single();

  if (error || !saved) {
    return NextResponse.json({ error: "Erro ao criar webhook." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "webhook_endpoint.create",
    resource: "webhook_endpoints",
    resource_id: saved.id,
    ip_address: getClientIp(req),
    metadata: { url, events },
  });

  return NextResponse.json({ ok: true, id: saved.id, secret });
}
