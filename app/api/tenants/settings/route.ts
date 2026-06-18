export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  locale: z.enum(["pt-BR", "en-US", "es"]).default("pt-BR"),
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

  const { tenant_id, name, locale } = parsed.data;
  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "tenant_owner", "admin", "tenant_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service
    .from("tenants")
    .update({ name, locale, updated_at: new Date().toISOString() })
    .eq("id", tenant_id);

  if (error) return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
