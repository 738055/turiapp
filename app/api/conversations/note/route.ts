export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, conversation_id, body } = parsed.data;

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();
  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  // Conversation must belong to the tenant.
  const { data: conv } = await service
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const { error } = await service.from("conversation_notes").insert({
    conversation_id,
    tenant_id,
    user_id: user.id,
    body: body.trim(),
  });
  if (error) return NextResponse.json({ error: "Erro ao salvar a nota." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
