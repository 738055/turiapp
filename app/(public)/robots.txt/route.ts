export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  canonicalUrl,
  getRequestBaseUrl,
  isMarketingHost,
  isReservedAppHost,
  resolveTenantSeoContext,
} from "@/lib/seo/tenant";

export async function GET() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  if (!tenantId) {
    if (isReservedAppHost(host) || !isMarketingHost(host)) {
      return robotsResponse(`User-agent: *
Disallow: /
`, "noindex");
    }

    const baseUrl = getRequestBaseUrl(headersList);
    return robotsResponse(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /_next/

Sitemap: ${canonicalUrl(baseUrl, "/sitemap.xml")}
`);
  }

  const seo = await resolveTenantSeoContext(tenantId, headersList);
  if (!seo) {
    return robotsResponse(`User-agent: *
Disallow: /
`, "noindex");
  }

  return robotsResponse(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /checkout
Disallow: /checkout/
Disallow: /carrinho
Disallow: /minha-fidelidade
Disallow: /avaliar/
Disallow: /cotacao/
Disallow: /*?q=
Disallow: /*?modulo=
Disallow: /*?preco_max=
Disallow: /*?pessoas=
Disallow: /*?ordenar=

Sitemap: ${canonicalUrl(seo.canonicalBaseUrl, "/sitemap.xml")}
`);
}

function robotsResponse(body: string, robotsTag?: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      ...(robotsTag ? { "X-Robots-Tag": robotsTag } : {}),
    },
  });
}
