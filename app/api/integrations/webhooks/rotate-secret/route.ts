export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { encrypt, generateToken } from "@/lib/crypto";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  endpoint_id: z.string().uuid(),
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

  const { endpoint_id, tenant_id } = parsed.data;
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

  const secret = `whsec_${generateToken(24)}`;
  const { error } = await service
    .from("webhook_endpoints")
    .update({ secret_encrypted: encrypt(secret) })
    .eq("id", endpoint_id)
    .eq("tenant_id", tenant_id);

  if (error) return NextResponse.json({ error: "Erro ao rotacionar segredo." }, { status: 500 });

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "webhook_endpoint.rotate_secret",
    resource: "webhook_endpoints",
    resource_id: endpoint_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true, secret });
}
