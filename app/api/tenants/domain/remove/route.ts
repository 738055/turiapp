export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { removeDomainFromVercel } from "@/lib/vercel";

const schema = z.object({
  domain: z.string().min(4).max(253),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!["tenant_owner", "tenant_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Domínio inválido." }, { status: 400 });
  }

  const { domain } = parsed.data;
  const service = createServiceClient();

  // Ensure the domain belongs to this tenant
  const { data: domainRow } = await service
    .from("tenant_domains")
    .select("id")
    .eq("domain", domain)
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (!domainRow) {
    return NextResponse.json({ error: "Domínio não encontrado." }, { status: 404 });
  }

  await removeDomainFromVercel(domain);

  await service
    .from("tenant_domains")
    .delete()
    .eq("domain", domain)
    .eq("tenant_id", membership.tenant_id);

  return NextResponse.json({ ok: true });
}
