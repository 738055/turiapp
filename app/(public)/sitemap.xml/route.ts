export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const host = headersList.get("host") ?? "localhost";
  const baseUrl = `https://${host}`;

  if (!tenantId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const service = createServiceClient();

  const [{ data: pages }, { data: products }] = await Promise.all([
    service
      .from("pages")
      .select("slug, updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published"),
    service
      .from("products")
      .select("slug, updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published"),
  ]);

  const urls: string[] = [
    `<url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...(pages ?? []).map(
      (p) =>
        `<url><loc>${baseUrl}/${p.slug}</loc><lastmod>${p.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
    ...(products ?? []).map(
      (p) =>
        `<url><loc>${baseUrl}/produto/${p.slug}</loc><lastmod>${p.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
