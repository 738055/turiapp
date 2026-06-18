export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  notification_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  all: z.boolean().optional(),
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

  const { notification_id, tenant_id, all } = parsed.data;
  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const now = new Date().toISOString();

  if (all) {
    await service.from("notifications").update({ read_at: now }).eq("tenant_id", tenant_id).is("read_at", null);
  } else if (notification_id) {
    await service.from("notifications").update({ read_at: now }).eq("id", notification_id).eq("tenant_id", tenant_id);
  } else {
    return NextResponse.json({ error: "notification_id ou all obrigatório." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
