export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateAffiliateCode } from "@/lib/affiliates";

// Turns the current user into an affiliate (idempotent — returns the existing
// code if they already are one). Retries on the rare code collision.
export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const service = createServiceClient();

  const { data: existing } = await service
    .from("affiliates")
    .select("code")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, code: existing.code });

  const { data: profile } = await service
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAffiliateCode(profile?.full_name ?? user.email?.split("@")[0]);
    const { data, error } = await service
      .from("affiliates")
      .insert({ user_id: user.id, code })
      .select("code")
      .single();
    if (data) return NextResponse.json({ ok: true, code: data.code });
    if (error?.code !== "23505") {
      return NextResponse.json({ error: "Erro ao criar afiliado." }, { status: 500 });
    }
    // 23505: either user already has one (race) or code collision — loop retries.
    const { data: again } = await service.from("affiliates").select("code").eq("user_id", user.id).maybeSingle();
    if (again) return NextResponse.json({ ok: true, code: again.code });
  }

  return NextResponse.json({ error: "Não foi possível gerar um código. Tente novamente." }, { status: 500 });
}
