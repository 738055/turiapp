export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { addDomainToVercel } from "@/lib/vercel";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

const schema = z.object({
  domain: z
    .string()
    .min(4)
    .max(253)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/, {
      message: "Domínio inválido. Use o formato: meusite.com.br",
    }),
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
    return NextResponse.json({ error: "Apenas proprietários podem configurar domínios." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Domínio inválido." }, { status: 400 });
  }

  const { domain } = parsed.data;
  const service = createServiceClient();

  // Plan gate: custom domains are a paid feature (not in Básico).
  const planLimits = await getPlanLimits(service, membership.tenant_id);
  if (!featureAllowed(planLimits, "custom_domain")) {
    return NextResponse.json(
      { error: "Domínio próprio não está incluído no seu plano. Faça upgrade para o Pro para usar seu domínio." },
      { status: 403 }
    );
  }

  // Check domain is not already in use by another tenant
  const { data: existing } = await service
    .from("tenant_domains")
    .select("tenant_id")
    .eq("domain", domain)
    .maybeSingle();

  if (existing && existing.tenant_id !== membership.tenant_id) {
    return NextResponse.json({ error: "Este domínio já está em uso." }, { status: 409 });
  }

  // Add to Vercel
  let vercelResult;
  try {
    vercelResult = await addDomainToVercel(domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar domínio.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Upsert in DB. Persist the DNS verification records (vercel_config) so the
  // panel can re-show the instructions on reload, not only right after adding.
  await service.from("tenant_domains").upsert(
    {
      tenant_id: membership.tenant_id,
      domain,
      type: "custom",
      verification_status: vercelResult.verified ? "verified" : "pending",
      ssl_status: "pending",
      vercel_config: { verification: vercelResult.verification ?? [] },
    },
    { onConflict: "domain" }
  );

  return NextResponse.json({
    ok: true,
    domain,
    verified: vercelResult.verified,
    verification: vercelResult.verification ?? [],
  });
}
