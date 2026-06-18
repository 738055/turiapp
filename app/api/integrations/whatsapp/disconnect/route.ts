export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
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

  const { tenant_id } = parsed.data;
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

  const { error } = await service
    .from("tenant_integrations")
    .update({
      whatsapp_api_key_encrypted: null,
      whatsapp_phone_id_encrypted: null,
      whatsapp_status: "disconnected",
      whatsapp_connected_at: null,
    })
    .eq("tenant_id", tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao desconectar." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "whatsapp.disconnect",
    resource: "tenant_integrations",
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
