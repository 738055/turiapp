import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServiceClient } from "@/lib/supabase/server";

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";
const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? `admin.${PLATFORM_HOST}`;
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? `app.${PLATFORM_HOST}`;
const STOREFRONT_STATUSES = ["active", "trial"];

/**
 * Resolve o tenant a partir do host da request.
 * Retorna null se for o host da plataforma (admin/app) ou desconhecido.
 */
async function resolveTenantFromHost(
  host: string
): Promise<{ tenantId: string; tenantSlug: string } | null> {
  // Strip port for local dev
  const cleanHost = host.split(":")[0];

  // Platform hosts — not tenant storefront
  if (
    cleanHost === PLATFORM_HOST ||
    cleanHost === ADMIN_HOST ||
    cleanHost === APP_HOST ||
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1"
  ) {
    return null;
  }

  const supabase = createServiceClient();

  // Check for custom domain first. Only active tenants resolve — a suspended
  // tenant's storefront goes down on the custom domain too, matching the
  // subdomain behavior below (billing enforcement).
  const { data: domainRow } = await supabase
    .from("tenant_domains")
    .select("tenant_id, tenants(slug, status)")
    .eq("domain", cleanHost)
    .eq("verification_status", "verified")
    .single();

  if (domainRow) {
    const t = domainRow.tenants as unknown as { slug: string; status: string } | null;
    if (t && STOREFRONT_STATUSES.includes(t.status)) {
      return { tenantId: domainRow.tenant_id, tenantSlug: t.slug };
    }
    return null;
  }

  // Check subdomain of platform host: <slug>.turiapp.com.br
  if (cleanHost.endsWith(`.${PLATFORM_HOST}`)) {
    const slug = cleanHost.replace(`.${PLATFORM_HOST}`, "");
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug")
      .eq("slug", slug)
      .in("status", STOREFRONT_STATUSES)
      .single();

    if (tenant) {
      return { tenantId: tenant.id, tenantSlug: tenant.slug };
    }
  }

  return null;
}

// Affiliate referral capture: ?ref=CODE → a 30-day cookie scoped to the whole
// platform domain so it survives landing → cadastro → onboarding across
// subdomains (marketing site, app.*). Read at tenant creation for attribution.
function applyRefCookie(response: Response, ref: string | null): Response {
  if (!ref || !/^[a-zA-Z0-9_-]{3,40}$/.test(ref)) return response;
  // append (not set) so we don't clobber the Supabase auth cookies already on
  // the response. Domain-scoped to the whole platform so it survives subdomains.
  response.headers.append(
    "Set-Cookie",
    `turiapp_ref=${ref}; Max-Age=${30 * 24 * 60 * 60}; Path=/; Domain=.${PLATFORM_HOST}; SameSite=Lax`
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const ref = request.nextUrl.searchParams.get("ref");
  const isSeoRoute = pathname === "/sitemap.xml" || pathname === "/robots.txt";

  // API routes and static files — skip tenant resolution
  if (
    !isSeoRoute &&
    (pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/favicon") ||
      pathname.includes("."))
  ) {
    return updateSession(request);
  }

  const cleanHost = host.split(":")[0];

  if (isSeoRoute && (cleanHost === PLATFORM_HOST || cleanHost === ADMIN_HOST || cleanHost === APP_HOST)) {
    return updateSession(request);
  }

  // ── Super admin panel ──────────────────────────────────────────────────────
  if (cleanHost === ADMIN_HOST) {
    // Drop any forged tenant headers — this branch bypasses updateSession (which
    // strips them), and the admin tree must never trust a client-supplied tenant.
    const adminHeaders = new Headers(request.headers);
    adminHeaders.delete("x-tenant-id");
    adminHeaders.delete("x-tenant-slug");

    // The super-admin pages live at /admin/* (the (super-admin) route group is
    // transparent in the URL, so /admin already resolves to them — no group-path
    // rewrite needed). Forwarding as-is also keeps the auth redirects (/login,
    // /mfa, /mfa-enroll) working on this host. Bare root → the dashboard.
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url, { request: { headers: adminHeaders } });
    }
    return NextResponse.next({ request: { headers: adminHeaders } });
  }

  // ── Tenant admin panel ─────────────────────────────────────────────────────
  if (cleanHost === APP_HOST) {
    const response = await updateSession(request);
    return applyRefCookie(response, ref);
  }

  // ── Tenant storefront (subdomain or custom domain) ─────────────────────────
  const tenant = await resolveTenantFromHost(host);

  if (tenant) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", tenant.tenantId);
    requestHeaders.set("x-tenant-slug", tenant.tenantSlug);

    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/storefront";

      const response = NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
      response.headers.set("x-tenant-id", tenant.tenantId);
      response.headers.set("x-tenant-slug", tenant.tenantSlug);
      return response;
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("x-tenant-id", tenant.tenantId);
    response.headers.set("x-tenant-slug", tenant.tenantSlug);
    return response;
  }

  // ── Local dev / platform root (marketing/landing) ──────────────────────────
  return applyRefCookie(await updateSession(request), ref);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
