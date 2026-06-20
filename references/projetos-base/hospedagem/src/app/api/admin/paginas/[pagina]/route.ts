import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pagina: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pagina } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("paginas_config")
    .select("*")
    .eq("pagina", pagina)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data || {});
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ pagina: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pagina } = await params;
  const body = await req.json();
  const supabase = createSupabaseServerClient();
  const { id: _id, pagina: _p, ...payload } = body;

  const { data, error } = await supabase
    .from("paginas_config")
    .upsert({
      pagina,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "pagina" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
