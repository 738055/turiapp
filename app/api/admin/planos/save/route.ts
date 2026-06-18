export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const schema = z.object({
  plan_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  price: z.number().min(0),
  stripe_price_id: z.string().nullable().optional(),
  limits: z.record(z.string(), z.unknown()),
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
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { plan_id, name, price, stripe_price_id, limits } = parsed.data;
  const service = createServiceClient();

  const { error } = await service
    .from("plans")
    .update({ name, price, stripe_price_id: stripe_price_id ?? null, limits })
    .eq("id", plan_id);

  if (error) return NextResponse.json({ error: "Erro ao salvar plano." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
