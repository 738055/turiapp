export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  tenant_id: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, subscription } = parsed.data;

  const service = createServiceClient();

  // Confirm the user belongs to the tenant they're subscribing for.
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  // Upsert by endpoint (re-subscribing the same browser shouldn't duplicate).
  const { error } = await service.from("push_subscriptions").upsert(
    {
      tenant_id,
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return NextResponse.json({ error: "Erro ao registrar notificações." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint obrigatório." }, { status: 400 });

  const service = createServiceClient();
  await service.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
