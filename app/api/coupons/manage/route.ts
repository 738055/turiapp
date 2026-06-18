export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  coupon_id: z.string().uuid(),
  action: z.enum(["toggle", "delete"]),
  active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, coupon_id, action, active } = parsed.data;

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !roleAtLeast(membership.role, "tenant_admin")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (action === "delete") {
    const { error } = await service.from("coupons").delete().eq("id", coupon_id).eq("tenant_id", tenant_id);
    if (error) return NextResponse.json({ error: "Erro ao remover cupom." }, { status: 500 });
  } else {
    const { error } = await service
      .from("coupons")
      .update({ active: active ?? true })
      .eq("id", coupon_id)
      .eq("tenant_id", tenant_id);
    if (error) return NextResponse.json({ error: "Erro ao atualizar cupom." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: `coupon.${action}`,
    resource: "coupons",
    resource_id: coupon_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
