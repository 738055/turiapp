export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hashApiKey, generateApiKey } from "@/lib/api-keys/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  scope: z.enum(["full", "read_only"]).default("full"),
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

  const { tenant_id, name, scope } = parsed.data;
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

  const { key, prefix } = generateApiKey();
  const { data: saved, error } = await service
    .from("api_keys")
    .insert({ tenant_id, name, key_hash: hashApiKey(key), key_prefix: prefix, scope })
    .select("id")
    .single();

  if (error || !saved) {
    return NextResponse.json({ error: "Erro ao criar chave de API." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "api_key.create",
    resource: "api_keys",
    resource_id: saved.id,
    ip_address: getClientIp(req),
    metadata: { name, scope },
  });

  return NextResponse.json({ ok: true, id: saved.id, key });
}
