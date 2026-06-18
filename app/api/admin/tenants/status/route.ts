export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const schema = z.object({
  tenant_id: z.string().uuid(),
  status: z.enum(["active", "suspended", "inactive"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("tenants")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
