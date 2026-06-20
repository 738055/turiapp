import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { absoluteUrl, canonicalUrl, formatTenantPageTitle, resolveTenantSeoContextFromHeaders } from "@/lib/seo/tenant";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import type { Page, Theme } from "@/types";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

async function getPublicPage(tenantId: string, slug: string): Promise<(Page & { theme: Theme | null }) | null> {
  const supabase = createServiceClient();
  const [{ data: page }, { data: theme }] = await Promise.all([
    supabase
      .from("pages")
      .select("*, sections:page_sections(*)")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .eq("status", "published")
      .single(),
    supabase.from("themes").select("*").eq("tenant_id", tenantId).single(),
  ]);

  if (!page) return null;
  return { ...page, theme };
}

export async function generateMetadata({ params }: PublicPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const seo = await resolveTenantSeoContextFromHeaders(headersList);
  if (!seo) return {};

  const page = await getPublicPage(seo.tenant.id, slug);
  if (!page) return {};

  const title = formatTenantPageTitle(page.seo_title ?? page.title, seo.tenant.name);
  const description = page.seo_description ?? undefined;
  const canonicalPath = page.is_home || page.slug === "inicio" ? "/" : `/${page.slug}`;
  const image = absoluteUrl(seo.canonicalBaseUrl, page.og_image_url);
  return {
    metadataBase: new URL(seo.canonicalBaseUrl),
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      siteName: seo.tenant.name,
      title,
      description,
      url: canonicalUrl(seo.canonicalBaseUrl, canonicalPath),
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();
  if (!tenantId) notFound();

  const page = await getPublicPage(tenantId, slug);
  if (!page) notFound();

  return (
    <main>
      {page.sections
        ?.sort((a, b) => a.order - b.order)
        .filter((section) => section.visible)
        .map((section) => (
          <SectionRenderer key={section.id} section={section} theme={page.theme} tenantId={tenantId} />
        ))}
    </main>
  );
}
