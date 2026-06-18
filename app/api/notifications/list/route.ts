export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id obrigatório." }, { status: 400 });

  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { data: notifications } = await service
    .from("notifications")
    .select("id, title, message, link, read_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(30);

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return NextResponse.json({ notifications: notifications ?? [], unreadCount });
}
