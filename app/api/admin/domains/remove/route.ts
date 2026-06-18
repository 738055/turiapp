export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { removeDomainFromVercel } from "@/lib/vercel";

const schema = z.object({
  domain_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: domainRecord } = await service
    .from("tenant_domains")
    .select("domain")
    .eq("id", parsed.data.domain_id)
    .single();

  if (domainRecord?.domain) {
    await removeDomainFromVercel(domainRecord.domain);
  }

  await service.from("tenant_domains").delete().eq("id", parsed.data.domain_id);

  return NextResponse.json({ ok: true });
}
