export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

const schema = z.object({
  tenant_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit({ key: `lead:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  const { data: tenant } = await service.from("tenants").select("id").eq("id", d.tenant_id).single();
  if (!tenant) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  if (d.product_id) {
    const { data: product } = await service
      .from("products")
      .select("id")
      .eq("id", d.product_id)
      .eq("tenant_id", d.tenant_id)
      .single();
    if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  const { data: lead, error } = await service
    .from("leads")
    .insert({
      tenant_id: d.tenant_id,
      product_id: d.product_id ?? null,
      name: d.name,
      email: d.email,
      phone: d.phone ?? null,
      message: d.message ?? null,
      source: "site",
      status: "novo",
    })
    .select("id")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Erro ao enviar solicitação. Tente novamente." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id: d.tenant_id,
    action: "lead.create",
    resource: "leads",
    resource_id: lead.id,
    ip_address: ip,
    metadata: { product_id: d.product_id ?? null, email: d.email },
  });

  triggerWebhookEvent(d.tenant_id, "lead.created", {
    lead_id: lead.id,
    product_id: d.product_id ?? null,
    name: d.name,
    email: d.email,
    phone: d.phone ?? null,
    message: d.message ?? null,
  }).catch(() => {});

  return NextResponse.json({ ok: true, leadId: lead.id });
}
