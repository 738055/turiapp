import Link from "next/link";
import Image from "next/image";
import { Check, Clock, MapPin } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { PageSection, Theme, Product, CardType } from "@/types";

interface ProductGridConfig {
  title?: string;
  subtitle?: string;
  module?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
  variant?: "marketplace" | "editorial";
}

interface ProductExtraData {
  duration?: string;
  location?: string;
  highlights?: string[];
  included?: string[];
}

type ProductWithRates = Product & { rates?: { price: number; currency: string }[] };

export async function ProductGridSection({
  section,
  theme,
  tenantId,
}: {
  section: PageSection;
  theme: Theme | null;
  tenantId: string;
}) {
  const cfg = (section.config ?? {}) as ProductGridConfig;
  const limit = cfg.limit ?? 8;
  const columns = cfg.columns ?? 3;
  const variant = cfg.variant ?? "marketplace";

  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select("*, rates:product_rates(price, currency)")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .limit(limit);

  if (cfg.module) query = query.eq("module", cfg.module);

  const { data: products } = await query;

  const colClass = columns === 4 ? "grid-cols-2 md:grid-cols-4" : columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3";

  return (
    <section className={variant === "editorial" ? "w-full bg-[var(--color-background)] px-6 py-20" : "w-full px-6 py-14"}>
      <div className="mx-auto w-full max-w-7xl">
        {(cfg.title || cfg.subtitle) && (
          <div className={variant === "editorial" ? "mb-10 max-w-2xl" : "mb-8 text-center"}>
            {cfg.title && <h2 className={variant === "editorial" ? "text-4xl font-semibold md:text-5xl" : "text-3xl font-bold"}>{cfg.title}</h2>}
            {cfg.subtitle && <p className="mt-2 text-gray-500">{cfg.subtitle}</p>}
          </div>
        )}

        {!products?.length ? (
          <p className="py-12 text-center text-gray-400">Nenhum produto disponivel ainda.</p>
        ) : (
          <div className={`grid ${colClass} gap-6`}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as unknown as ProductWithRates}
                cardType={theme?.card_type ?? "card-image-large"}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  cardType,
  variant,
}: {
  product: ProductWithRates;
  cardType: CardType;
  variant: "marketplace" | "editorial";
}) {
  const lowestRate = product.rates?.reduce(
    (min, r) => (r.price < min.price ? r : min),
    product.rates[0]
  );
  const extra = (product.extra_data ?? {}) as ProductExtraData;
  const highlights = stringArray(extra.highlights).slice(0, 3);
  const included = stringArray(extra.included).slice(0, 2);
  const meta = [
    extra.duration ? { icon: Clock, label: extra.duration } : null,
    extra.location ? { icon: MapPin, label: extra.location } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string }[];

  if (cardType === "card-horizontal") {
    return (
      <Link href={`/produto/${product.slug}`} className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-gray-100 bg-white transition-all hover:shadow-lg sm:flex-row">
        <ProductImage product={product} className="h-52 w-full sm:h-auto sm:w-56" />
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{product.type}</p>
            <h3 className="mt-1 font-semibold leading-snug text-gray-900">{product.title}</h3>
            <ProductMeta meta={meta} />
            <ProductHighlights items={highlights.length ? highlights : included} />
          </div>
          {lowestRate && <PriceLine rate={lowestRate} className="mt-5" />}
        </div>
      </Link>
    );
  }

  if (cardType === "card-minimal") {
    return (
      <Link href={`/produto/${product.slug}`} className="group flex min-h-64 flex-col rounded-[var(--radius)] border border-gray-100 bg-white p-5 transition-all hover:border-[var(--color-primary)]/40 hover:shadow-md">
        <p className="text-xs uppercase tracking-wide text-gray-400">{product.type}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-gray-900">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{product.description}</p>
        <ProductMeta meta={meta} />
        <ProductHighlights items={highlights.length ? highlights : included} />
        {lowestRate && <PriceLine rate={lowestRate} className="mt-auto pt-5" />}
      </Link>
    );
  }

  return (
    <Link href={`/produto/${product.slug}`} className={`group overflow-hidden rounded-[var(--radius)] border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${variant === "editorial" ? "shadow-sm" : ""}`}>
      <ProductImage product={product} className="aspect-[4/3] w-full" badge />
      <div className="p-4">
        <h3 className="mb-1 font-semibold leading-snug text-gray-900">{product.title}</h3>
        <p className="line-clamp-2 text-xs text-gray-400">{product.description}</p>
        <ProductMeta meta={meta} />
        <ProductHighlights items={highlights.length ? highlights : included} />
        {lowestRate && (
          <PriceLine
            rate={lowestRate}
            className={cardType === "card-price-highlight" ? "mt-4 rounded-lg bg-gray-50 p-3" : "mt-3"}
          />
        )}
        {product.sale_mode === "whatsapp" && <p className="mt-2 text-xs font-medium text-green-600">Contato via WhatsApp</p>}
      </div>
    </Link>
  );
}

function ProductImage({ product, className, badge = false }: { product: ProductWithRates; className: string; badge?: boolean }) {
  return (
    <div className={`relative flex-shrink-0 overflow-hidden bg-gray-100 ${className}`}>
      {product.images?.[0] ? (
        <Image src={product.images[0]} alt={product.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <MapPin className="h-10 w-10" />
        </div>
      )}
      {badge && (
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs capitalize">{product.type}</span>
        </div>
      )}
    </div>
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function ProductMeta({ meta }: { meta: { icon: typeof Clock; label: string }[] }) {
  if (!meta.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
      {meta.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5 text-gray-400" /> {label}
        </span>
      ))}
    </div>
  );
}

function ProductHighlights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-[11px] font-medium text-gray-700">
          <Check className="h-3 w-3 text-[var(--color-primary)]" /> {item}
        </span>
      ))}
    </div>
  );
}

function PriceLine({ rate, className = "" }: { rate: { price: number; currency: string }; className?: string }) {
  return (
    <p className={`text-sm font-bold ${className}`} style={{ color: "var(--color-primary)" }}>
      A partir de {formatCurrency(rate.price, rate.currency)}
    </p>
  );
}
