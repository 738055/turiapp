export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

const schema = z.object({
  customer_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  internal_notes: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.issues }, { status: 400 });
  }

  const { customer_id, tenant_id, ...fields } = parsed.data;
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

  if (!(await tenantHasProFeature(service, tenant_id))) {
    return NextResponse.json({ error: proFeatureError("crm") }, { status: 403 });
  }

  const { error } = await service
    .from("customers")
    .update({
      ...(fields.tags !== undefined ? { tags: fields.tags } : {}),
      ...(fields.internal_notes !== undefined ? { internal_notes: fields.internal_notes || null } : {}),
    })
    .eq("id", customer_id)
    .eq("tenant_id", tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar cliente." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "customer.update",
    resource: "customers",
    resource_id: customer_id,
    metadata: { fields: Object.keys(fields) },
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
