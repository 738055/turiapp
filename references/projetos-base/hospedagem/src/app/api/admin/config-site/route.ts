import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("config_site").select("*").eq("id", 1).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data || {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createSupabaseServerClient();

  // Remove id from body to avoid conflicts
  const { id: _id, ...payload } = body;

  const { data, error } = await supabase
    .from("config_site")
    .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
