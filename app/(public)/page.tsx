import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { absoluteUrl, canonicalUrl, resolveTenantSeoContext } from "@/lib/seo/tenant";
import type { Page, Theme } from "@/types";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

async function getHomePage(tenantId: string): Promise<(Page & { theme: Theme | null }) | null> {
  const supabase = createServiceClient();

  const [{ data: page }, { data: theme }] = await Promise.all([
    supabase
      .from("pages")
      .select("*, sections:page_sections(*)")
      .eq("tenant_id", tenantId)
      .eq("is_home", true)
      .eq("status", "published")
      .single(),
    supabase
      .from("themes")
      .select("*")
      .eq("tenant_id", tenantId)
      .single(),
  ]);

  if (!page) return null;
  return { ...page, theme };
}

export default async function StorefrontHome() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  if (!tenantId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">TuriApp</h1>
        <p className="text-gray-500 max-w-md">
          Plataforma white label de turismo. Acesse o painel em{" "}
          <strong>app.turiapp.com.br</strong> para criar sua loja.
        </p>
      </main>
    );
  }

  const [pageData, seo] = await Promise.all([
    getHomePage(tenantId),
    resolveTenantSeoContext(tenantId, headersList),
  ]);

  if (!pageData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Em breve</h1>
        <p className="text-gray-500">Estamos montando nossa loja. Volte em breve!</p>
      </main>
    );
  }

  return (
    <main>
      {seo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TravelAgency",
              name: seo.tenant.name,
              url: canonicalUrl(seo.canonicalBaseUrl, "/"),
              ...(pageData.og_image_url ? { image: absoluteUrl(seo.canonicalBaseUrl, pageData.og_image_url) } : {}),
            }),
          }}
        />
      )}
      {pageData.sections
        ?.sort((a, b) => a.order - b.order)
        .filter((s) => s.visible)
        .map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            theme={pageData.theme}
            tenantId={tenantId}
          />
        ))}
    </main>
  );
}
