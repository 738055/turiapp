export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { syncIcalImport } from "@/lib/ical/sync";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  tenant_id: z.string().uuid(),
  product_id: z.string().uuid(),
  url: z.string().url().max(1000),
  source_label: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { tenant_id, product_id, url, source_label } = parsed.data;

  // Only http(s) external feeds.
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

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

  // Product must belong to the tenant.
  const { data: product } = await service
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const { data: imp, error } = await service
    .from("product_ical_imports")
    .insert({ tenant_id, product_id, url, source_label: source_label ?? null })
    .select("id, product_id, url, source_label")
    .single();

  if (error || !imp) {
    if (error?.code === "23505") return NextResponse.json({ error: "Esta URL já foi adicionada." }, { status: 409 });
    return NextResponse.json({ error: "Erro ao adicionar calendário." }, { status: 500 });
  }

  const result = await syncIcalImport(service, imp);

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "ical.import_added",
    resource: "product_ical_imports",
    resource_id: imp.id,
    ip_address: getClientIp(req),
    metadata: { product_id, url },
  });

  return NextResponse.json({ ok: true, synced: result.ok, days: result.days, error: result.error });
}
