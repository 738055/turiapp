export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  code: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, hífen ou underline."),
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(0),
  min_order: z.number().min(0).default(0),
  max_uses: z.number().int().min(1).nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const d = parsed.data;

  if (d.type === "percent" && d.value > 100) {
    return NextResponse.json({ error: "Desconto percentual não pode passar de 100%." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", d.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !roleAtLeast(membership.role, "tenant_admin")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service.from("coupons").insert({
    tenant_id: d.tenant_id,
    code: d.code.toUpperCase(),
    type: d.type,
    value: d.value,
    min_order: d.min_order,
    max_uses: d.max_uses ?? null,
    expires_at: d.expires_at || null,
    active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar cupom." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id: d.tenant_id,
    user_id: user.id,
    action: "coupon.created",
    resource: "coupons",
    ip_address: getClientIp(req),
    metadata: { code: d.code.toUpperCase(), type: d.type, value: d.value },
  });

  return NextResponse.json({ ok: true });
}
