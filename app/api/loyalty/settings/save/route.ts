export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  active: z.boolean(),
  earn_mode: z.enum(["per_amount", "per_booking"]),
  points_per_amount: z.coerce.number().min(0),
  points_per_booking: z.coerce.number().int().min(0),
  redeem_value_per_point: z.coerce.number().min(0),
  min_redeem_points: z.coerce.number().int().min(0),
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

  const { tenant_id, ...fields } = parsed.data;
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
    .from("loyalty_settings")
    .upsert({ tenant_id, ...fields }, { onConflict: "tenant_id" });

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar configurações de fidelidade." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "loyalty_settings.update",
    resource: "loyalty_settings",
    resource_id: tenant_id,
    metadata: fields,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
