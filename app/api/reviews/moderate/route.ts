export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  review_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, review_id, decision } = parsed.data;

  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service
    .from("reviews")
    .update({
      status: decision,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", review_id)
    .eq("tenant_id", tenant_id)
    .not("submitted_at", "is", null); // can only moderate submitted reviews

  if (error) return NextResponse.json({ error: "Erro ao moderar avaliação." }, { status: 500 });

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: `review.${decision}`,
    resource: "reviews",
    resource_id: review_id,
    ip_address: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
