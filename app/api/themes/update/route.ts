export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Note: z.record in Zod v4 requires (keyType, valueType) signature
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";

const schema = z.object({
  tenant_id: z.string().uuid(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font_heading: z.string().max(200),
  font_body: z.string().max(200),
  border_radius: z.string().max(20),
  menu_type: z.enum(["top-classic", "top-centered", "top-transparent", "sidebar"]),
  card_type: z.enum(["card-image-large", "card-horizontal", "card-minimal", "card-price-highlight"]),
  logo_url: z.string().url().nullable().optional(),
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

  const d = parsed.data;
  const service = createServiceClient();

  // Verify user belongs to the tenant
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", d.tenant_id)
    .eq("user_id", user.id)
    .single();

  // Mirror the themes RLS (has_tenant_role('tenant_admin')): this route runs as
  // service_role and bypasses RLS, so it must enforce the same role itself.
  if (!membership || !roleAtLeast(membership.role, "tenant_admin")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { error } = await service.from("themes").upsert(
    {
      tenant_id: d.tenant_id,
      primary_color: d.primary_color,
      secondary_color: d.secondary_color,
      accent_color: d.accent_color,
      background_color: d.background_color,
      text_color: d.text_color,
      font_heading: d.font_heading,
      font_body: d.font_body,
      border_radius: d.border_radius,
      menu_type: d.menu_type,
      card_type: d.card_type,
      logo_url: d.logo_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar tema." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
