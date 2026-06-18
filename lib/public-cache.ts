import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

// Storefront pages are resolved per-request by host header (x-tenant-id), so the
// page render is inherently dynamic — full ISR is not possible. Instead we cache
// the expensive DB reads (product + theme) keyed strictly by tenantId so tenants
// never share a cache entry. A short TTL keeps the data fresh (edits reflect
// within the window) while absorbing read bursts. This is the multi-tenant
// equivalent of ISR for the data layer.

const TTL_SECONDS = 120;

export function productTag(tenantId: string, slug: string) {
  return `product:${tenantId}:${slug}`;
}
export function themeTag(tenantId: string) {
  return `theme:${tenantId}`;
}

export function getCachedPublicProduct(tenantId: string, slug: string) {
  return unstable_cache(
    async () => {
      const service = createServiceClient();
      const { data } = await service
        .from("products")
        .select("*, rates:product_rates(*)")
        .eq("tenant_id", tenantId)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      return data;
    },
    ["public-product", tenantId, slug],
    { revalidate: TTL_SECONDS, tags: [productTag(tenantId, slug)] }
  )();
}

export function getCachedPublicTheme(tenantId: string) {
  return unstable_cache(
    async () => {
      const service = createServiceClient();
      const { data } = await service.from("themes").select("*").eq("tenant_id", tenantId).single();
      return data;
    },
    ["public-theme", tenantId],
    { revalidate: TTL_SECONDS, tags: [themeTag(tenantId)] }
  )();
}
