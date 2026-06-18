export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/crypto";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  lead_id: z.string().uuid(),
  product_id: z.string().uuid(),
  rate_id: z.string().uuid().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  guests: z.number().min(1).max(99).default(1),
  total_price: z.number().min(0),
  currency: z.string().default("BRL"),
  notes: z.string().max(1000).optional(),
  expires_in_hours: z.number().min(1).max(720).default(48),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  const { data: lead } = await service.from("leads").select("tenant_id").eq("id", d.lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", lead.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_staff", "tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: product } = await service
    .from("products")
    .select("id")
    .eq("id", d.product_id)
    .eq("tenant_id", lead.tenant_id)
    .single();
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + d.expires_in_hours * 60 * 60 * 1000).toISOString();

  const { data: quote, error } = await service
    .from("quotes")
    .insert({
      tenant_id: lead.tenant_id,
      lead_id: d.lead_id,
      product_id: d.product_id,
      rate_id: d.rate_id ?? null,
      check_in: d.check_in ?? null,
      check_out: d.check_out ?? null,
      guests: d.guests,
      total_price: d.total_price,
      currency: d.currency,
      notes: d.notes ?? null,
      token,
      expires_at: expiresAt,
    })
    .select("id, token")
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Erro ao criar cotação." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id: lead.tenant_id,
    user_id: user.id,
    action: "quote.create",
    resource: "quotes",
    resource_id: quote.id,
    ip_address: getClientIp(req),
    metadata: { lead_id: d.lead_id, product_id: d.product_id },
  });

  return NextResponse.json({ ok: true, quoteId: quote.id, token: quote.token });
}
