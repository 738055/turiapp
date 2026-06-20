import { createServiceClient } from "@/lib/supabase/server";

const PLATFORM_HOST = cleanHost(
  process.env.NEXT_PUBLIC_PLATFORM_HOST ??
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ??
    "turiapp.com.br"
);
const ADMIN_HOST = cleanHost(process.env.NEXT_PUBLIC_ADMIN_HOST ?? `admin.${PLATFORM_HOST}`);
const APP_HOST = cleanHost(process.env.NEXT_PUBLIC_APP_HOST ?? `app.${PLATFORM_HOST}`);
const STOREFRONT_STATUSES = ["active", "trial"];

type HeaderReader = {
  get(name: string): string | null;
};

interface TenantSeoContext {
  tenant: {
    id: string;
    name: string;
    slug: string;
    updated_at?: string | null;
  };
  requestHost: string;
  requestBaseUrl: string;
  canonicalHost: string;
  canonicalBaseUrl: string;
}

interface TenantLookupRow {
  id: string;
  status: string;
}

export function cleanHost(value: string | null | undefined): string {
  return (value ?? "")
    .split(",")[0]
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase();
}

function cleanAuthority(value: string | null | undefined): string {
  return (value ?? "")
    .split(",")[0]
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

function getRequestAuthority(headersList: HeaderReader): string {
  return cleanAuthority(headersList.get("x-forwarded-host") ?? headersList.get("host"));
}

export function getRequestHost(headersList: HeaderReader): string {
  return cleanHost(headersList.get("x-forwarded-host") ?? headersList.get("host"));
}

export function getRequestProtocol(headersList: HeaderReader, host = getRequestHost(headersList)): string {
  const forwarded = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded === "http" || forwarded === "https") return forwarded;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
}

export function getRequestBaseUrl(headersList: HeaderReader): string {
  const authority = getRequestAuthority(headersList);
  return `${getRequestProtocol(headersList, authority)}://${authority}`;
}

export function isMarketingHost(host: string): boolean {
  const clean = cleanHost(host);
  return clean === PLATFORM_HOST || clean === `www.${PLATFORM_HOST}` || clean === "localhost" || clean === "127.0.0.1";
}

export function isReservedAppHost(host: string): boolean {
  const clean = cleanHost(host);
  return clean === ADMIN_HOST || clean === APP_HOST;
}

export function formatTenantPageTitle(title: string | null | undefined, tenantName: string): string {
  const storeName = tenantName.trim() || "Loja";
  const pageTitle = title?.trim();
  const normalized = pageTitle?.toLocaleLowerCase("pt-BR");

  if (!pageTitle || normalized === "inicio" || normalized === "início" || normalized === "home") {
    return storeName;
  }

  if (pageTitle.toLocaleLowerCase("pt-BR").includes(storeName.toLocaleLowerCase("pt-BR"))) {
    return pageTitle;
  }

  return `${pageTitle} | ${storeName}`;
}

export async function resolveTenantSeoContextFromHeaders(headersList: HeaderReader): Promise<TenantSeoContext | null> {
  const explicitTenantId = headersList.get("x-tenant-id");
  if (explicitTenantId) return resolveTenantSeoContext(explicitTenantId, headersList);

  const requestHost = getRequestHost(headersList);
  if (!requestHost || isMarketingHost(requestHost) || isReservedAppHost(requestHost)) return null;

  const service = createServiceClient();
  const { data: domainRow } = await service
    .from("tenant_domains")
    .select("tenant_id, tenants(id, status)")
    .eq("domain", requestHost)
    .eq("verification_status", "verified")
    .maybeSingle();

  const domainTenant = domainRow?.tenants as unknown as TenantLookupRow | null;
  if (domainTenant && STOREFRONT_STATUSES.includes(domainTenant.status)) {
    return resolveTenantSeoContext(domainTenant.id, headersList);
  }

  if (requestHost.endsWith(`.${PLATFORM_HOST}`)) {
    const slug = requestHost.replace(`.${PLATFORM_HOST}`, "");
    if (!slug) return null;

    const { data: tenant } = await service
      .from("tenants")
      .select("id, status")
      .eq("slug", slug)
      .in("status", STOREFRONT_STATUSES)
      .maybeSingle();

    if (tenant) return resolveTenantSeoContext(tenant.id, headersList);
  }

  return null;
}

export async function resolveTenantSeoContext(
  tenantId: string,
  headersList: HeaderReader
): Promise<TenantSeoContext | null> {
  const service = createServiceClient();
  const requestHost = getRequestHost(headersList);
  const requestBaseUrl = getRequestBaseUrl(headersList);

  const [{ data: tenant }, { data: requestDomain }, { data: customDomain }] = await Promise.all([
    service
      .from("tenants")
      .select("id, name, slug, updated_at")
      .eq("id", tenantId)
      .maybeSingle(),
    service
      .from("tenant_domains")
      .select("domain, type, verification_status, ssl_status")
      .eq("tenant_id", tenantId)
      .eq("domain", requestHost)
      .maybeSingle(),
    service
      .from("tenant_domains")
      .select("domain")
      .eq("tenant_id", tenantId)
      .eq("type", "custom")
      .eq("verification_status", "verified")
      .eq("ssl_status", "issued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!tenant) return null;

  const exactCustomHost =
    requestDomain?.type === "custom" && requestDomain.verification_status === "verified"
      ? cleanHost(requestDomain.domain)
      : null;
  const canonicalHost =
    exactCustomHost ||
    cleanHost(customDomain?.domain) ||
    cleanHost(`${tenant.slug}.${PLATFORM_HOST}`) ||
    requestHost;
  const protocol = canonicalHost === requestHost ? getRequestProtocol(headersList, requestHost) : "https";

  return {
    tenant,
    requestHost,
    requestBaseUrl,
    canonicalHost,
    canonicalBaseUrl: `${protocol}://${canonicalHost}`,
  };
}

export function canonicalUrl(baseUrl: string, path = "/"): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function absoluteUrl(baseUrl: string, value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return canonicalUrl(baseUrl, raw);
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function isoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
}
