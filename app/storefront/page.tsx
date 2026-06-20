import type { Metadata } from "next";
import { headers } from "next/headers";
import PublicLayout from "../(public)/layout";
import StorefrontHome from "../(public)/page";
import { createServiceClient } from "@/lib/supabase/server";
import { absoluteUrl, canonicalUrl, formatTenantPageTitle, resolveTenantSeoContextFromHeaders } from "@/lib/seo/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const seo = await resolveTenantSeoContextFromHeaders(headersList);
  if (!seo) return {};

  const { data: homePage } = await createServiceClient()
    .from("pages")
    .select("title,seo_title,seo_description,og_image_url")
    .eq("tenant_id", seo.tenant.id)
    .eq("is_home", true)
    .eq("status", "published")
    .maybeSingle();

  const title = formatTenantPageTitle(homePage?.seo_title ?? homePage?.title, seo.tenant.name);
  const description =
    homePage?.seo_description ??
    `Confira produtos, pacotes, reservas e atendimento de ${seo.tenant.name}.`;
  const image = absoluteUrl(seo.canonicalBaseUrl, homePage?.og_image_url);

  return {
    metadataBase: new URL(seo.canonicalBaseUrl),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: seo.tenant.name,
      title,
      description,
      url: canonicalUrl(seo.canonicalBaseUrl, "/"),
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

export default function TenantStorefrontHome() {
  return (
    <PublicLayout>
      <StorefrontHome />
    </PublicLayout>
  );
}
