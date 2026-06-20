import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
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
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) return {};

  const page = await getPublicPage(tenantId, slug);
  if (!page) return {};

  return {
    title: page.seo_title ?? page.title,
    description: page.seo_description,
    openGraph: {
      title: page.seo_title ?? page.title,
      description: page.seo_description,
      images: page.og_image_url ? [page.og_image_url] : [],
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
