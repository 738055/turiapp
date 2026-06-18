export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(_req: NextRequest) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const baseUrl = `https://${host}`;

  const txt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
