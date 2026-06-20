import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/duplicate";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: original, error: fetchErr } = await supabase
    .from("transporte_opcoes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !original) {
    return NextResponse.json({ error: "Opção não encontrada" }, { status: 404 });
  }

  const newSlug = await generateUniqueSlug(supabase, "transporte_opcoes", original.titulo.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  const { id: _id, created_at: _ca, ...rest } = original;

  const { data: created, error: insertErr } = await supabase
    .from("transporte_opcoes")
    .insert({
      ...rest,
      titulo: `${original.titulo} (cópia)`,
      disponivel: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
