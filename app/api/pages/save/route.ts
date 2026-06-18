export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const sectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  order: z.number(),
  visible: z.boolean(),
  config: z.record(z.string(), z.unknown()),
});

const schema = z.object({
  tenant_id: z.string().uuid(),
  page_id: z.string().uuid(),
  meta: z.object({
    title: z.string().min(1).max(200),
    seo_title: z.string().max(200).optional(),
    seo_description: z.string().max(500).optional(),
    show_in_nav: z.boolean(),
    status: z.enum(["draft", "published"]),
  }),
  sections: z.array(sectionSchema),
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

  const { tenant_id, page_id, meta, sections } = parsed.data;
  const service = createServiceClient();

  // Verify ownership
  const { data: page } = await service
    .from("pages")
    .select("id")
    .eq("id", page_id)
    .eq("tenant_id", tenant_id)
    .single();

  if (!page) return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });

  // Update page metadata
  await service.from("pages").update({
    title: meta.title,
    seo_title: meta.seo_title ?? null,
    seo_description: meta.seo_description ?? null,
    show_in_nav: meta.show_in_nav,
    status: meta.status,
    updated_at: new Date().toISOString(),
  }).eq("id", page_id);

  // Replace all sections: delete old, insert new
  await service.from("page_sections").delete().eq("page_id", page_id);

  if (sections.length > 0) {
    await service.from("page_sections").insert(
      sections.map((s) => ({
        id: s.id,
        page_id,
        type: s.type,
        order: s.order,
        visible: s.visible,
        config: s.config,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
