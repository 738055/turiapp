export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createStripeCustomer } from "@/lib/stripe";
import { slugify } from "@/lib/utils";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { getStoreTemplate } from "@/lib/store-templates";

const schema = z.object({
  company_name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0ea5e9"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0369a1"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f59e0b"),
  template: z.string().default("turismo-basico"),
  sale_mode: z.enum(["booking", "whatsapp"]).default("whatsapp"),
  whatsapp_number: z.string().optional(),
  product_title: z.string().optional(),
  product_module: z.string().optional(),
  product_type: z.string().optional(),
  custom_domain: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 3 tenant creations per IP per hour
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit({ key: `tenant-create:${ip}`, limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 1 hora." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const selectedTemplate = getStoreTemplate(d.template);

  // Check slug availability
  const { data: existing } = await serviceClient
    .from("tenants")
    .select("id")
    .eq("slug", d.slug)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Esse nome de loja já está em uso. Escolha outro." }, { status: 409 });
  }

  // Create Stripe customer
  let stripeCustomerId: string | null = null;
  try {
    stripeCustomerId = await createStripeCustomer(user.email!, d.company_name, "pending");
  } catch {
    // Non-fatal — tenant can subscribe later
  }

  // Create tenant
  const { data: tenant, error: tenantErr } = await serviceClient
    .from("tenants")
    .insert({
      slug: d.slug,
      name: d.company_name,
      status: "trial",
      stripe_customer_id: stripeCustomerId,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (tenantErr || !tenant) {
    return NextResponse.json({ error: "Erro ao criar loja." }, { status: 500 });
  }

  // Update Stripe customer with tenant_id
  if (stripeCustomerId) {
    try {
      const { stripe } = await import("@/lib/stripe");
      await stripe.customers.update(stripeCustomerId, { metadata: { tenant_id: tenant.id } });
    } catch { /* non-fatal */ }
  }

  // Add user as tenant_owner
  await serviceClient.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: "tenant_owner",
  });

  // Create default theme
  await serviceClient.from("themes").insert({
    tenant_id: tenant.id,
    ...selectedTemplate.theme,
    primary_color: d.primary_color,
    secondary_color: d.secondary_color,
    accent_color: d.accent_color,
  });

  // Create default integrations row
  await serviceClient.from("tenant_integrations").insert({ tenant_id: tenant.id });

  // Create home page from template
  const { data: page } = await serviceClient
    .from("pages")
    .insert({
      tenant_id: tenant.id,
      slug: "inicio",
      title: "Início",
      status: "published",
      is_home: true,
      show_in_nav: true,
      nav_order: 0,
      template: d.template,
    })
    .select()
    .single();

  // Add default sections for the template
  if (page) {
    const sections = buildTemplateSections(selectedTemplate.sections, d.company_name, d.whatsapp_number);
    await serviceClient.from("page_sections").insert(
      sections.map((s, i) => ({ ...s, page_id: page.id, order: i }))
    );
  }

  // Create default nav items
  await serviceClient.from("navigation_items").insert([
    { tenant_id: tenant.id, label: "Início", href: "/", order: 0 },
    { tenant_id: tenant.id, label: "Produtos", href: "/busca", order: 1 },
    { tenant_id: tenant.id, label: "Contato", href: "/contato", order: 2 },
  ]);

  // Create a first editable product. If the tenant leaves it blank, use the
  // selected template's sample so the storefront does not start empty.
  const productDefaults = selectedTemplate.productDefaults;
  const productTitle = d.product_title?.trim() || productDefaults.title;
  const productModule = d.product_module || productDefaults.module;
  const productType = d.product_type || productDefaults.type;
  if (productTitle && productModule) {
    await serviceClient.from("products").insert({
      tenant_id: tenant.id,
      module: productModule,
      type: productType,
      title: productTitle,
      slug: slugify(productTitle),
      description: d.product_title?.trim() ? "" : productDefaults.description,
      status: "published",
      sale_mode: d.sale_mode,
      whatsapp_number: d.whatsapp_number ?? null,
      extra_data: productDefaults.extra_data,
    });
  }

  // Affiliate attribution: if a referral cookie is present and maps to a real
  // affiliate (and isn't a self-referral), record a pending referral. Conversion
  // + commission happen later when the tenant starts paying (platform webhook).
  const refCode = req.cookies.get("turiapp_ref")?.value;
  if (refCode) {
    const { data: affiliate } = await serviceClient
      .from("affiliates")
      .select("id, user_id")
      .eq("code", refCode)
      .maybeSingle();
    if (affiliate && affiliate.user_id !== user.id) {
      await serviceClient
        .from("affiliate_referrals")
        .insert({ affiliate_id: affiliate.id, tenant_id: tenant.id, status: "pending" });
    }
  }

  // Create onboarding tracker
  await serviceClient.from("tenant_onboarding").insert({ tenant_id: tenant.id });

  // Create subdomain record
  await serviceClient.from("tenant_domains").insert({
    tenant_id: tenant.id,
    domain: `${d.slug}.${process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br"}`,
    type: "subdomain",
    verification_status: "verified",
    ssl_status: "issued",
  });

  // Custom domain (if provided — verification is async)
  if (d.custom_domain) {
    await serviceClient.from("tenant_domains").insert({
      tenant_id: tenant.id,
      domain: d.custom_domain,
      type: "custom",
      verification_status: "pending",
      ssl_status: "pending",
    });
  }

  return NextResponse.json({ tenantId: tenant.id, slug: tenant.slug });
}

function buildTemplateSections(
  sections: Array<{ type: string; visible: boolean; config: Record<string, unknown> }>,
  companyName: string,
  whatsapp?: string
): Array<{ type: string; visible: boolean; config: Record<string, unknown> }> {
  return sections.map((section) => {
    const config = JSON.parse(JSON.stringify(section.config ?? {})) as Record<string, unknown>;
    if (section.type === "hero" && typeof config.title === "string") {
      config.title = config.title.replace("{{company_name}}", companyName);
    }
    if (section.type === "contact") {
      config.whatsapp = whatsapp ?? config.whatsapp ?? "";
      config.whatsapp_number = whatsapp ?? config.whatsapp_number ?? "";
    }
    if (section.type === "footer") config.company_name = companyName;
    return { ...section, config };
  });
}
