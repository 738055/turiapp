import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { absoluteUrl, canonicalUrl, resolveTenantSeoContextFromHeaders } from "@/lib/seo/tenant";
import { AnalyticsScripts, GTMNoScript } from "@/components/public/AnalyticsScripts";
import { CookieConsent } from "@/components/public/CookieConsent";
import { CartButton } from "@/components/public/CartButton";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";
import { PublicHeader } from "@/components/public/PublicHeader";
import type { NavItem, Theme } from "@/types";

// Mirror of the proxy's storefront gate: a suspended/non-active tenant must not
// render a storefront even if a tenant id reaches this layout by another path.
const STOREFRONT_STATUSES = ["active", "trial"];

interface TenantPublicData {
  tenant: { name: string; status: string } | null;
  theme: Theme | null;
  navItems: NavItem[];
  integrations: {
    google_analytics_id?: string | null;
    google_tag_manager_id?: string | null;
    facebook_pixel_id?: string | null;
    tiktok_pixel_id?: string | null;
    head_scripts?: string | null;
    whatsapp_number?: string | null;
    floating_whatsapp_enabled?: boolean | null;
    floating_whatsapp_mode?: "native" | "script" | string | null;
    floating_whatsapp_label?: string | null;
    floating_whatsapp_message?: string | null;
    floating_whatsapp_script?: string | null;
    cookie_consent_enabled?: boolean;
    cookie_consent_text?: string | null;
    privacy_policy_url?: string | null;
  } | null;
}

function buildSiteJsonLd({ name, baseUrl, logo }: { name: string; baseUrl: string; logo: string | null }) {
  const logoUrl = absoluteUrl(baseUrl, logo);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      url: baseUrl,
      ...(logoUrl ? { logo: logoUrl } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${canonicalUrl(baseUrl, "/busca")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

async function getTenantPublicData(tenantId: string): Promise<TenantPublicData> {
  const supabase = createServiceClient();
  const [{ data: tenant }, { data: theme }, { data: integrations }, { data: navItems }] = await Promise.all([
    supabase.from("tenants").select("name, status").eq("id", tenantId).single(),
    supabase.from("themes").select("*").eq("tenant_id", tenantId).single(),
    supabase
      .from("tenant_integrations")
      .select(
        "google_analytics_id,google_tag_manager_id,facebook_pixel_id,tiktok_pixel_id,head_scripts,whatsapp_number,floating_whatsapp_enabled,floating_whatsapp_mode,floating_whatsapp_label,floating_whatsapp_message,floating_whatsapp_script,cookie_consent_enabled,cookie_consent_text,privacy_policy_url"
      )
      .eq("tenant_id", tenantId)
      .single(),
    supabase
      .from("navigation_items")
      .select("id, tenant_id, label, href, order, target")
      .eq("tenant_id", tenantId)
      .order("order", { ascending: true }),
  ]);
  return { tenant, theme: theme as Theme | null, integrations, navItems: (navItems ?? []) as NavItem[] };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  if (!tenantId) notFound();

  const { tenant, theme, navItems, integrations } = await getTenantPublicData(tenantId);

  // A storefront only exists for active/trial tenants. Suspended or unknown
  // tenants 404 here too — this is the second layer behind the proxy's gate.
  if (!tenant || !STOREFRONT_STATUSES.includes(tenant.status)) notFound();

  // Site-wide structured data (Organization + WebSite with a sitelinks search
  // box) — helps Google/SGE understand the brand and surface a search action.
  const seo = await resolveTenantSeoContextFromHeaders(headersList);
  const siteJsonLd = seo
    ? buildSiteJsonLd({ name: tenant.name ?? seo.tenant.name, baseUrl: seo.canonicalBaseUrl, logo: theme?.logo_url ?? null })
    : null;

  const cssVars = theme
    ? {
        "--color-primary": theme.primary_color,
        "--color-secondary": theme.secondary_color,
        "--color-accent": theme.accent_color,
        "--color-background": theme.background_color,
        "--color-text": theme.text_color,
        "--radius": theme.border_radius,
        "--font-heading": theme.font_heading,
        "--font-body": theme.font_body,
      }
    : {};

  const showConsent = integrations?.cookie_consent_enabled !== false;

  return (
    <div style={cssVars as React.CSSProperties} className="flex min-h-screen flex-col">
      {siteJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      )}

      {/* Storefront webfonts. The per-tenant theme sets --font-heading/--font-body
          to one of these families; without this loader they fell back to system
          fonts. Next hoists these <link>s into <head> and dedupes them. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* App Router hoists this into <head> for the whole storefront — the
          pages/_document warning does not apply here. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />

      {/* GTM noscript (must be as early as possible in body) */}
      {integrations?.google_tag_manager_id && (
        <GTMNoScript gtmId={integrations.google_tag_manager_id} />
      )}

      <PublicHeader tenantName={tenant?.name ?? "Minha Loja"} theme={theme} navItems={navItems} />

      <div className={theme?.menu_type === "sidebar" ? "flex min-h-screen flex-col lg:pl-72" : "flex min-h-screen flex-col"}>
        {children}
      </div>

      {/* Floating multi-product cart indicator (hidden when empty) */}
      <CartButton />

      <FloatingWhatsAppButton
        enabled={integrations?.floating_whatsapp_enabled}
        mode={integrations?.floating_whatsapp_mode}
        phone={integrations?.whatsapp_number}
        label={integrations?.floating_whatsapp_label}
        message={integrations?.floating_whatsapp_message}
        script={integrations?.floating_whatsapp_script}
      />

      {/* LGPD cookie consent banner */}
      {showConsent && (
        <CookieConsent
          primaryColor={theme?.primary_color}
          consentText={integrations?.cookie_consent_text}
          privacyPolicyUrl={integrations?.privacy_policy_url}
        />
      )}

      {/* Analytics scripts (injected after body so they respect consent) */}
      <AnalyticsScripts
        googleAnalyticsId={integrations?.google_analytics_id}
        googleTagManagerId={integrations?.google_tag_manager_id}
        facebookPixelId={integrations?.facebook_pixel_id}
        tiktokPixelId={integrations?.tiktok_pixel_id}
        headScripts={integrations?.head_scripts}
      />
    </div>
  );
}
