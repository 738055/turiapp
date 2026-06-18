import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { PageSection, Theme, Product, CardType } from "@/types";

interface ProductGridConfig {
  title?: string;
  subtitle?: string;
  module?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
}

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
    <section className="py-12 px-6 max-w-7xl mx-auto w-full">
      {(cfg.title || cfg.subtitle) && (
        <div className="mb-8 text-center">
          {cfg.title && <h2 className="text-3xl font-bold">{cfg.title}</h2>}
          {cfg.subtitle && (
            <p className="mt-2 text-gray-500">{cfg.subtitle}</p>
          )}
        </div>
      )}

      {!products?.length ? (
        <p className="text-center text-gray-400 py-12">Nenhum produto disponível ainda.</p>
      ) : (
        <div className={`grid ${colClass} gap-6`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product as unknown as Product}
              cardType={theme?.card_type ?? "card-image-large"}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  cardType,
}: {
  product: Product & { rates?: { price: number; currency: string }[] };
  cardType: CardType;
}) {
  const lowestRate = product.rates?.reduce(
    (min, r) => (r.price < min.price ? r : min),
    product.rates[0]
  );

  if (cardType === "card-horizontal") {
    return (
      <Link
        href={`/produto/${product.slug}`}
        className="flex gap-4 rounded-[var(--radius)] border border-gray-100 bg-white p-3 hover:shadow-md transition-shadow"
      >
        {product.images?.[0] && (
          <div className="relative h-24 w-32 flex-shrink-0 rounded overflow-hidden">
            <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-between py-1">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{product.type}</p>
            <h3 className="font-semibold text-gray-900 leading-snug">{product.title}</h3>
          </div>
          {lowestRate && (
            <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
              A partir de {formatCurrency(lowestRate.price, lowestRate.currency)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  // Default: card-image-large
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group rounded-[var(--radius)] border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <span className="text-4xl">🏖️</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="text-xs bg-white/90 rounded-full px-2 py-0.5 capitalize">
            {product.type}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 leading-snug mb-1">{product.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-2">{product.description}</p>
        {lowestRate && (
          <p className="mt-3 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
            A partir de {formatCurrency(lowestRate.price, lowestRate.currency)}
          </p>
        )}
        {product.sale_mode === "whatsapp" && (
          <p className="mt-1 text-xs text-green-600">💬 Contato via WhatsApp</p>
        )}
      </div>
    </Link>
  );
}
