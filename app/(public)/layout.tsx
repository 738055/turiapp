import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { AnalyticsScripts, GTMNoScript } from "@/components/public/AnalyticsScripts";
import { CookieConsent } from "@/components/public/CookieConsent";
import { CartButton } from "@/components/public/CartButton";
import { PublicHeader } from "@/components/public/PublicHeader";
import type { NavItem, Theme } from "@/types";

interface TenantPublicData {
  tenant: { name: string } | null;
  theme: Theme | null;
  navItems: NavItem[];
  integrations: {
    google_analytics_id?: string | null;
    google_tag_manager_id?: string | null;
    facebook_pixel_id?: string | null;
    tiktok_pixel_id?: string | null;
    head_scripts?: string | null;
    cookie_consent_enabled?: boolean;
    cookie_consent_text?: string | null;
    privacy_policy_url?: string | null;
  } | null;
}

async function getTenantPublicData(tenantId: string): Promise<TenantPublicData> {
  const supabase = createServiceClient();
  const [{ data: tenant }, { data: theme }, { data: integrations }, { data: navItems }] = await Promise.all([
    supabase.from("tenants").select("name").eq("id", tenantId).single(),
    supabase.from("themes").select("*").eq("tenant_id", tenantId).single(),
    supabase
      .from("tenant_integrations")
      .select(
        "google_analytics_id,google_tag_manager_id,facebook_pixel_id,tiktok_pixel_id,head_scripts,cookie_consent_enabled,cookie_consent_text,privacy_policy_url"
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
