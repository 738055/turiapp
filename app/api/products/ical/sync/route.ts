export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { syncIcalImport } from "@/lib/ical/sync";

const schema = z.object({
  tenant_id: z.string().uuid(),
  import_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  action: z.enum(["sync", "delete"]).default("sync"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, import_id, product_id, action } = parsed.data;

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

  if (action === "delete") {
    if (!import_id) return NextResponse.json({ error: "import_id obrigatório." }, { status: 400 });
    // Remove the feed and its blocks.
    const { data: imp } = await service
      .from("product_ical_imports")
      .select("product_id, source_label")
      .eq("id", import_id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    if (imp) {
      await service
        .from("availability")
        .delete()
        .eq("product_id", imp.product_id)
        .eq("note", `iCal:${imp.source_label || "externo"}`);
    }
    await service.from("product_ical_imports").delete().eq("id", import_id).eq("tenant_id", tenant_id);
    return NextResponse.json({ ok: true });
  }

  // Sync one import or all imports of a product.
  let query = service.from("product_ical_imports").select("id, product_id, url, source_label").eq("tenant_id", tenant_id);
  if (import_id) query = query.eq("id", import_id);
  else if (product_id) query = query.eq("product_id", product_id);
  else return NextResponse.json({ error: "Informe import_id ou product_id." }, { status: 400 });

  const { data: imports } = await query;
  let totalDays = 0;
  for (const imp of imports ?? []) {
    const r = await syncIcalImport(service, imp);
    totalDays += r.days;
  }

  return NextResponse.json({ ok: true, days: totalDays });
}
