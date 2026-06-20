export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { validateWhatsAppCredentials } from "@/lib/whatsapp/360dialog";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

const schema = z.object({
  tenant_id: z.string().uuid(),
  api_key: z.string().min(10),
  phone_id: z.string().min(3),
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

  const { tenant_id, api_key, phone_id } = parsed.data;
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

  if (!(await tenantHasProFeature(service, tenant_id))) {
    return NextResponse.json({ error: proFeatureError("support") }, { status: 403 });
  }

  const valid = await validateWhatsAppCredentials(api_key);
  if (!valid) {
    return NextResponse.json({ error: "Credenciais do WhatsApp Business API inválidas." }, { status: 400 });
  }

  const { error } = await service
    .from("tenant_integrations")
    .update({
      whatsapp_api_key_encrypted: encrypt(api_key),
      whatsapp_phone_id_encrypted: encrypt(phone_id),
      whatsapp_status: "connected",
      whatsapp_connected_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar credenciais." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "whatsapp.connect",
    resource: "tenant_integrations",
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
