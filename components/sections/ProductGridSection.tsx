import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  Clock,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import {
  lowestRate,
  productCategoryLabel,
  productExtra,
  productImages,
  rateSuffix,
  type PublicProduct,
} from "@/lib/storefront-design";
import { formatCurrency } from "@/lib/utils";
import type { CardType, PageSection, Theme } from "@/types";

interface ProductGridConfig {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  module?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
  variant?: "marketplace" | "editorial";
  layout?: "vertical" | "horizontal";
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
  const variant = cfg.variant ?? (cfg.module === "hospedagem" ? "editorial" : "marketplace");

  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select("*, rates:product_rates(*)")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cfg.module) query = query.eq("module", cfg.module);

  const { data } = await query;
  const products = (data ?? []) as PublicProduct[];

  if (variant === "editorial") {
    return <EditorialProductSection cfg={cfg} products={products} theme={theme} />;
  }

  return <MarketplaceProductSection cfg={cfg} products={products} theme={theme} />;
}

function MarketplaceProductSection({
  cfg,
  products,
  theme,
}: {
  cfg: ProductGridConfig;
  products: PublicProduct[];
  theme: Theme | null;
}) {
  const columns = cfg.columns ?? 3;
  const layout = cfg.layout ?? (theme?.card_type === "card-horizontal" ? "horizontal" : "vertical");
  const colClass =
    layout === "horizontal"
      ? "grid-cols-1"
      : columns === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : columns === 2
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader
          align="center"
          eyebrow={cfg.eyebrow || "Experiencias selecionadas"}
          title={cfg.title || "Mais reservados"}
          subtitle={cfg.subtitle || "Produtos cadastrados pela loja ja entram no desenho profissional do modelo escolhido."}
        />

        {!products.length ? (
          <EmptyState />
        ) : (
          <div className={`grid ${colClass} gap-6`}>
            {products.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                theme={theme}
                cardType={theme?.card_type ?? "card-image-large"}
                layout={layout}
                variant="marketplace"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EditorialProductSection({
  cfg,
  products,
  theme,
}: {
  cfg: ProductGridConfig;
  products: PublicProduct[];
  theme: Theme | null;
}) {
  return (
    <section className="w-full bg-[var(--color-background)] px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="left"
          eyebrow={cfg.eyebrow || "Nossas acomodacoes"}
          title={cfg.title || "Hospedagem que transforma viagens."}
          subtitle={cfg.subtitle || "Cada produto usa fotos, capacidade, tarifas e detalhes cadastrados no painel para manter a vitrine elegante sem trabalho de design."}
          editorial
        />

        {!products.length ? (
          <EmptyState editorial />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                theme={theme}
                cardType={theme?.card_type ?? "card-image-large"}
                layout="vertical"
                variant="editorial"
                featured={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StorefrontProductCard({
  product,
  theme,
  cardType,
  layout = "vertical",
  variant = "marketplace",
  featured = false,
  priority = false,
}: {
  product: PublicProduct;
  theme: Theme | null;
  cardType?: CardType;
  layout?: "vertical" | "horizontal";
  variant?: "marketplace" | "editorial";
  featured?: boolean;
  priority?: boolean;
}) {
  if (variant === "editorial" || product.module === "hospedagem") {
    return <EditorialProductCard product={product} featured={featured} priority={priority} />;
  }

  if (cardType === "card-minimal") {
    return <MinimalProductCard product={product} theme={theme} />;
  }

  return <MarketplaceProductCard product={product} theme={theme} layout={layout} priority={priority} />;
}

function MarketplaceProductCard({
  product,
  theme,
  layout,
  priority = false,
}: {
  product: PublicProduct;
  theme: Theme | null;
  layout: "vertical" | "horizontal";
  priority?: boolean;
}) {
  const extra = productExtra(product);
  const images = productImages(product);
  const rate = lowestRate(product);
  const category = productCategoryLabel(product);
  const highlights = (extra.highlights.length ? extra.highlights : extra.included).slice(0, 3);
  const meta = [
    extra.capacity ? { icon: Users, label: extra.capacity } : null,
    extra.location ? { icon: MapPin, label: extra.location } : null,
    extra.duration ? { icon: Clock, label: extra.duration } : null,
    extra.guideLanguages.length ? { icon: Languages, label: extra.guideLanguages.slice(0, 2).join(", ") } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  if (layout === "horizontal") {
    return (
      <Link href={`/produto/${product.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-lg sm:flex-row">
        <ProductCover src={images[0]} alt={product.title} className="h-56 w-full sm:h-auto sm:w-[280px]" priority={priority} />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">{category}</span>
            <span className="text-gray-300">.</span>
            <RatingLine />
          </div>
          <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-[var(--color-primary)]">
            {product.title}
          </h3>
          {product.description && <p className="mb-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-gray-500">{product.description}</p>}
          <MetaList meta={meta} />
          <FeatureChips items={highlights} />
          <CancellationLine text={extra.cancellationPolicy} />
        </div>
        <PricingBox rate={rate} product={product} horizontal theme={theme} />
      </Link>
    );
  }

  return (
    <Link href={`/produto/${product.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-lg">
      <div className="relative">
        <ProductCover src={images[0]} alt={product.title} className="aspect-[3/2] w-full" priority={priority} />
        <div className="absolute bottom-3 left-3 rounded border border-white/70 bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
          {extra.cancellationPolicy ? "Cancelamento facil" : "Atendimento local"}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">{category}</span>
          <RatingLine />
        </div>
        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[var(--color-primary)]">
          {product.title}
        </h3>
        <MetaList meta={meta} />
        <FeatureChips items={highlights} />
      </div>
      <PricingBox rate={rate} product={product} theme={theme} />
    </Link>
  );
}

function EditorialProductCard({
  product,
  featured,
  priority = false,
}: {
  product: PublicProduct;
  featured: boolean;
  priority?: boolean;
}) {
  const extra = productExtra(product);
  const images = productImages(product);
  const rate = lowestRate(product);
  const specs = [
    extra.capacity ? { icon: Users, label: extra.capacity } : null,
    extra.bedrooms ? { icon: BedDouble, label: extra.bedrooms } : null,
    extra.bathrooms ? { icon: Bath, label: extra.bathrooms } : null,
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  return (
    <Link href={`/produto/${product.slug}`} className="group relative block overflow-hidden bg-white shadow-sm transition-shadow duration-500 hover:shadow-xl">
      <div className="relative h-72 overflow-hidden bg-[#1c3a2a]/10">
        <Image
          src={images[0]}
          alt={product.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C3A2A]/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {featured && (
          <span className="absolute left-4 top-4 bg-[var(--color-accent)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white">
            Destaque
          </span>
        )}
        {rate && (
          <div className="absolute bottom-4 left-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-2xl font-light text-white">
              {formatCurrency(rate.price, rate.currency)}
              <span className="ml-1 text-sm text-white/70">{rateSuffix(rate)}</span>
            </p>
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)]">{productCategoryLabel(product)}</p>
        <h3 className="mb-3 text-2xl font-light text-[#1C3A2A] transition-colors group-hover:text-[var(--color-accent)]">
          {product.title}
        </h3>
        {product.description && <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-[#1C3A2A]/60">{product.description}</p>}
        {!!specs.length && (
          <div className="mb-5 flex flex-wrap items-center gap-5 border-t border-[#1C3A2A]/10 pt-4 text-xs text-[#1C3A2A]/55">
            {specs.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            ))}
          </div>
        )}
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#1C3A2A] transition-colors group-hover:text-[var(--color-accent)]">
          Ver detalhes <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function MinimalProductCard({ product, theme }: { product: PublicProduct; theme: Theme | null }) {
  const extra = productExtra(product);
  const rate = lowestRate(product);
  const highlights = (extra.highlights.length ? extra.highlights : extra.included).slice(0, 3);

  return (
    <Link href={`/produto/${product.slug}`} className="group flex min-h-64 flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[var(--color-primary)]/40 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{productCategoryLabel(product)}</p>
      <h3 className="mt-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-[var(--color-primary)]">{product.title}</h3>
      {product.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">{product.description}</p>}
      <FeatureChips items={highlights} />
      <PricingBox rate={rate} product={product} theme={theme} />
    </Link>
  );
}

function ProductCover({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-gray-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, 320px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

function RatingLine() {
  return (
    <span className="flex items-center gap-1 text-[13px] text-gray-500">
      <Star className="h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
      <strong className="text-gray-900">Novo</strong>
    </span>
  );
}

function MetaList({ meta }: { meta: { icon: typeof MapPin; label: string }[] }) {
  if (!meta.length) return null;
  return (
    <div className="space-y-1.5">
      {meta.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-[13px] text-gray-600">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" /> <span className="line-clamp-1">{label}</span>
        </span>
      ))}
    </div>
  );
}

function FeatureChips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[12px] font-medium text-gray-700">
          <Check className="h-3 w-3 text-[var(--color-primary)]" /> {item}
        </span>
      ))}
    </div>
  );
}

function CancellationLine({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
      <ShieldCheck className="h-4 w-4" /> Cancelamento informado
    </p>
  );
}

function PricingBox({
  rate,
  product,
  horizontal = false,
  theme,
}: {
  rate: ReturnType<typeof lowestRate>;
  product: PublicProduct;
  horizontal?: boolean;
  theme: Theme | null;
}) {
  const color = theme?.secondary_color || "var(--color-text)";

  return (
    <div className={horizontal ? "flex w-full shrink-0 flex-col justify-center border-t border-gray-100 p-5 sm:w-[240px] sm:border-l sm:border-t-0" : "mt-auto border-t border-gray-100 p-4"}>
      <div className="mb-3">
        <span className="block text-[11px] font-medium text-gray-500">
          {rate?.rate_type === "per_night" ? "Por noite, a partir de" : "Por pessoa, a partir de"}
        </span>
        {rate ? (
          <>
            <span className="block text-2xl font-bold leading-none" style={{ color }}>
              {formatCurrency(rate.price, rate.currency)}
            </span>
            <span className="mt-1 block text-[12px] text-gray-500">ou 10x sem juros</span>
          </>
        ) : (
          <span className="block text-lg font-bold text-gray-900">Consultar tarifa</span>
        )}
      </div>
      <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:brightness-95">
        {product.sale_mode === "whatsapp" ? "Solicitar" : "Ver detalhes"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align,
  editorial = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align: "left" | "center";
  editorial?: boolean;
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`mb-12 max-w-2xl ${alignClass}`}>
      <p className={editorial ? "mb-4 text-[11px] uppercase tracking-[0.35em] text-[var(--color-accent)]" : "mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]"}>
        {eyebrow}
      </p>
      <h2 className={editorial ? "text-4xl font-light leading-tight text-[#1C3A2A] md:text-5xl" : "text-3xl font-extrabold text-gray-900 md:text-4xl"}>
        {title}
      </h2>
      <p className={editorial ? "mt-5 text-base leading-relaxed text-[#1C3A2A]/60" : "mt-3 text-gray-500"}>
        {subtitle}
      </p>
    </div>
  );
}

function EmptyState({ editorial = false }: { editorial?: boolean }) {
  return (
    <div className={editorial ? "border border-[#1C3A2A]/10 bg-white py-16 text-center" : "rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center"}>
      <p className={editorial ? "text-sm text-[#1C3A2A]/60" : "text-sm text-gray-500"}>
        Nenhum produto publicado ainda.
      </p>
    </div>
  );
}
