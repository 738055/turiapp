export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  available_slots: z.number().min(0).max(9999),
  blocked: z.boolean(),
  note: z.string().max(200).nullable().optional(),
});

const schema = z.object({
  product_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  entries: z.array(entrySchema).max(366),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { product_id, tenant_id, entries } = parsed.data;
  const service = createServiceClient();

  // Auth check: product must belong to tenant
  const { data: product } = await service
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("tenant_id", tenant_id)
    .single();
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  if (!entries.length) return NextResponse.json({ ok: true });

  // Upsert each entry
  const { error } = await service
    .from("availability")
    .upsert(
      entries.map((e) => ({
        product_id,
        date: e.date,
        available_slots: e.available_slots,
        blocked: e.blocked,
        note: e.note ?? null,
      })),
      { onConflict: "product_id,date" }
    );

  if (error) return NextResponse.json({ error: "Erro ao salvar disponibilidade." }, { status: 500 });

  return NextResponse.json({ ok: true, count: entries.length });
}
