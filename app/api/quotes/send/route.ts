export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail, renderQuoteEmailHtml } from "@/lib/email/resend";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { proFeatureError, tenantHasProFeature } from "@/lib/plans/pro-features";

const schema = z.object({
  quote_id: z.string().uuid(),
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

  const service = createServiceClient();

  const { data: quote } = await service
    .from("quotes")
    .select("id, tenant_id, lead_id, product_id, check_in, check_out, guests, total_price, currency, token, expires_at")
    .eq("id", parsed.data.quote_id)
    .single();

  if (!quote) return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", quote.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_staff", "tenant_admin", "tenant_owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (!(await tenantHasProFeature(service, quote.tenant_id))) {
    return NextResponse.json({ error: proFeatureError("crm") }, { status: 403 });
  }

  const [{ data: lead }, { data: product }, { data: tenant }, { data: theme }] = await Promise.all([
    service.from("leads").select("name, email").eq("id", quote.lead_id).single(),
    service.from("products").select("title").eq("id", quote.product_id).single(),
    service.from("tenants").select("name, slug").eq("id", quote.tenant_id).single(),
    service.from("themes").select("primary_color").eq("tenant_id", quote.tenant_id).single(),
  ]);

  if (!lead || !tenant) {
    return NextResponse.json({ error: "Dados incompletos para envio." }, { status: 500 });
  }

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "turiapp.com.br";
  const quoteUrl = `https://${tenant.slug}.${platformDomain}/cotacao/${quote.token}`;

  const html = renderQuoteEmailHtml({
    customerName: lead.name,
    productTitle: product?.title ?? "Produto",
    checkinDate: quote.check_in,
    checkoutDate: quote.check_out,
    guests: quote.guests,
    totalPrice: quote.total_price,
    currency: quote.currency,
    tenantName: tenant.name,
    primaryColor: theme?.primary_color ?? "#0ea5e9",
    quoteUrl,
    expiresAt: quote.expires_at,
  });

  try {
    await sendEmail({
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      to: lead.email,
      subject: `Sua cotação: ${product?.title ?? "Produto"}`,
      html,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar e-mail." }, { status: 500 });
  }

  await service.from("quotes").update({ sent_at: new Date().toISOString() }).eq("id", quote.id);
  await service.from("leads").update({ status: "cotacao_enviada" }).eq("id", quote.lead_id);

  await writeAuditLog({
    tenant_id: quote.tenant_id,
    user_id: user.id,
    action: "quote.send",
    resource: "quotes",
    resource_id: quote.id,
    ip_address: getClientIp(req),
    metadata: { lead_email: lead.email },
  });

  return NextResponse.json({ ok: true });
}
