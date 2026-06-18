export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  tenant_id: z.string().uuid(),
  provider: z.enum(["stripe", "mercadopago"]),
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

  const { tenant_id, provider } = parsed.data;
  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  // Owner-only: mirrors the tenant_payment_accounts RLS (Etapa 16 RBAC hardening).
  if (!membership || !["tenant_owner", "owner", "super_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Apenas o proprietário da conta pode gerenciar pagamentos." }, { status: 403 });
  }

  await service
    .from("tenant_payment_accounts")
    .delete()
    .eq("tenant_id", tenant_id)
    .eq("provider", provider);

  return NextResponse.json({ ok: true });
}
