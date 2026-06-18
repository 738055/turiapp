export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { retryWebhookDelivery } from "@/lib/webhooks/dispatch";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  delivery_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
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

  const { delivery_id, tenant_id } = parsed.data;
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

  const { data: delivery } = await service
    .from("webhook_deliveries")
    .select("id")
    .eq("id", delivery_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!delivery) return NextResponse.json({ error: "Entrega não encontrada." }, { status: 404 });

  await retryWebhookDelivery(delivery_id);

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "webhook_delivery.retry",
    resource: "webhook_deliveries",
    resource_id: delivery_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
