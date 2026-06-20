export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import {
  absoluteUrl,
  canonicalUrl,
  getRequestBaseUrl,
  isoDate,
  isMarketingHost,
  isReservedAppHost,
  resolveTenantSeoContext,
  xmlEscape,
} from "@/lib/seo/tenant";

interface SitemapEntry {
  loc: string;
  lastmod?: string | null;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  images?: { loc: string; title?: string | null; caption?: string | null }[];
}

interface PageRow {
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_home: boolean;
  updated_at: string | null;
}

interface ProductRow {
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  images: string[] | null;
  updated_at: string | null;
}

export async function GET() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
    if (isReservedAppHost(host) || !isMarketingHost(host)) {
      return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
    }
    const baseUrl = getRequestBaseUrl(headersList);
    return sitemapResponse(
      buildXml([
        {
          loc: canonicalUrl(baseUrl, "/"),
          changefreq: "weekly",
          priority: "1.0",
        },
        {
          loc: canonicalUrl(baseUrl, "/cadastro"),
          changefreq: "monthly",
          priority: "0.7",
        },
      ])
    );
  }

  const seo = await resolveTenantSeoContext(tenantId, headersList);
  if (!seo) return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });

  const service = createServiceClient();
  const [{ data: pages }, { data: products }] = await Promise.all([
    service
      .from("pages")
      .select("slug,title,seo_title,seo_description,og_image_url,is_home,updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("is_home", { ascending: false })
      .order("nav_order", { ascending: true })
      .range(0, 4999),
    service
      .from("products")
      .select("slug,title,seo_title,seo_description,og_image_url,images,updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .range(0, 4999),
  ]);

  const pageRows = (pages ?? []) as PageRow[];
  const productRows = (products ?? []) as ProductRow[];
  const homePage = pageRows.find((page) => page.is_home);
  const entries: SitemapEntry[] = [
    {
      loc: canonicalUrl(seo.canonicalBaseUrl, "/"),
      lastmod: isoDate(homePage?.updated_at ?? seo.tenant.updated_at),
      changefreq: "weekly",
      priority: "1.0",
      images: imageEntries(seo.canonicalBaseUrl, homePage?.og_image_url ? [homePage.og_image_url] : [], homePage?.seo_title ?? homePage?.title),
    },
    ...pageRows
      .filter((page) => !page.is_home && page.slug !== "inicio")
      .map((page) => ({
        loc: canonicalUrl(seo.canonicalBaseUrl, `/${encodeURIComponent(page.slug)}`),
        lastmod: isoDate(page.updated_at),
        changefreq: "weekly" as const,
        priority: "0.8",
        images: imageEntries(seo.canonicalBaseUrl, page.og_image_url ? [page.og_image_url] : [], page.seo_title ?? page.title, page.seo_description),
      })),
    ...(productRows.length
      ? [
          {
            loc: canonicalUrl(seo.canonicalBaseUrl, "/busca"),
            lastmod: isoDate(productRows[0]?.updated_at),
            changefreq: "daily" as const,
            priority: "0.6",
          },
        ]
      : []),
    ...productRows.map((product) => ({
      loc: canonicalUrl(seo.canonicalBaseUrl, `/produto/${encodeURIComponent(product.slug)}`),
      lastmod: isoDate(product.updated_at),
      changefreq: "weekly" as const,
      priority: "0.7",
      images: imageEntries(
        seo.canonicalBaseUrl,
        [product.og_image_url, ...(product.images ?? [])].filter((image): image is string => Boolean(image)).slice(0, 6),
        product.seo_title ?? product.title,
        product.seo_description
      ),
    })),
  ];

  return sitemapResponse(buildXml(entries));
}

function imageEntries(baseUrl: string, images: string[], title?: string | null, caption?: string | null) {
  return images
    .map((image) => absoluteUrl(baseUrl, image))
    .filter((image): image is string => typeof image === "string" && /^https?:\/\//i.test(image))
    .map((loc) => ({ loc, title, caption }));
}

function buildXml(entries: SitemapEntry[]) {
  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : "";
    const images = (entry.images ?? [])
      .map((image) => {
        const title = image.title ? `<image:title>${xmlEscape(image.title)}</image:title>` : "";
        const caption = image.caption ? `<image:caption>${xmlEscape(image.caption)}</image:caption>` : "";
        return `<image:image><image:loc>${xmlEscape(image.loc)}</image:loc>${title}${caption}</image:image>`;
      })
      .join("");
    return `<url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority>${images}</url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}

function sitemapResponse(xml: string) {
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
