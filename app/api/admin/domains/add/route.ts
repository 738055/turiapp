export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { addDomainToVercel } from "@/lib/vercel";

const schema = z.object({
  tenant_id: z.string().uuid(),
  domain: z.string().min(4).max(253),
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

  const { tenant_id, domain } = parsed.data;
  const service = createServiceClient();

  // Add to Vercel
  let vercelResult;
  try {
    vercelResult = await addDomainToVercel(domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao adicionar domínio na Vercel.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Save to DB
  await service.from("tenant_domains").upsert(
    {
      tenant_id,
      domain,
      type: "custom",
      verification_status: vercelResult.verified ? "verified" : "pending",
      ssl_status: "pending",
    },
    { onConflict: "domain" }
  );

  return NextResponse.json({
    ok: true,
    verified: vercelResult.verified,
    verification: vercelResult.verification,
  });
}
