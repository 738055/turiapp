import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bath,
  BedDouble,
  Calendar,
  Check,
  Clock,
  Image as ImageIcon,
  Languages,
  Map,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BookingWidget } from "@/components/public/BookingWidget";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import { createServiceClient } from "@/lib/supabase/server";
import { featureAllowed, getPlanLimits } from "@/lib/plans/limits";
import { getCachedPublicTheme } from "@/lib/public-cache";
import { absoluteUrl, canonicalUrl, formatTenantPageTitle, resolveTenantSeoContextFromHeaders } from "@/lib/seo/tenant";
import {
  lowestRate,
  productCategoryLabel,
  productExtra,
  productImages,
  rateSuffix,
  type PublicProduct,
} from "@/lib/storefront-design";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product, ProductRate, Theme } from "@/types";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const seo = await resolveTenantSeoContextFromHeaders(headersList);
  if (!seo) return {};

  const { data: product } = await createServiceClient()
    .from("products")
    .select("title, seo_title, seo_description, og_image_url, images")
    .eq("tenant_id", seo.tenant.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!product) return {};

  const title = formatTenantPageTitle(product.seo_title ?? product.title, seo.tenant.name);
  const description = product.seo_description ?? undefined;
  const image = absoluteUrl(seo.canonicalBaseUrl, product.og_image_url ?? product.images?.[0]);
  const canonicalPath = `/produto/${slug}`;

  return {
    metadataBase: new URL(seo.canonicalBaseUrl),
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      siteName: seo.tenant.name,
      title,
      description,
      url: canonicalUrl(seo.canonicalBaseUrl, canonicalPath),
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const seo = await resolveTenantSeoContextFromHeaders(headersList);
  const tenantId = headersList.get("x-tenant-id") ?? seo?.tenant.id;

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const service = createServiceClient();
  const [{ data: product }, theme] = await Promise.all([
    service
      .from("products")
      .select("*, rates:product_rates(*)")
      .eq("tenant_id", tenantId ?? "")
      .eq("slug", slug)
      .eq("status", "published")
      .single(),
    getCachedPublicTheme(tenantId ?? ""),
  ]);

  if (!product) notFound();

  const p = product as unknown as PublicProduct;
  const publicRates = (p.rates ?? [])
    .filter((productRate) => productRate.available !== false)
    .sort((a, b) => a.price - b.price);
  const productForSale = { ...p, rates: publicRates } as PublicProduct;
  const t = theme as unknown as Theme | null;
  const extra = productExtra(p);
  const images = productImages(p);
  const category = productCategoryLabel(p);
  const rate = lowestRate(productForSale);
  const primaryColor = t?.primary_color ?? "#0ea5e9";
  const secondaryColor = t?.secondary_color ?? "#111827";
  const [{ data: reviews }, { data: paymentAccounts }, { data: integrations }, planLimits] = await Promise.all([
    service
      .from("reviews")
      .select("id, customer_name, rating, body, submitted_at")
      .eq("tenant_id", tenantId ?? "")
      .eq("product_id", p.id)
      .eq("status", "approved")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(20),
    service
      .from("tenant_payment_accounts")
      .select("provider, status")
      .eq("tenant_id", tenantId ?? "")
      .eq("status", "connected"),
    service
      .from("tenant_integrations")
      .select("whatsapp_number")
      .eq("tenant_id", tenantId ?? "")
      .maybeSingle(),
    tenantId ? getPlanLimits(service, tenantId) : Promise.resolve(null),
  ]);

  const bookingEngineAllowed = featureAllowed(planLimits, "booking_engine");
  const hasConnectedPayment = paymentAccounts?.some((account) => account.status === "connected") ?? false;
  const canReserveOnline = p.sale_mode === "booking" && bookingEngineAllowed && publicRates.length > 0;
  const actionProduct = {
    ...productForSale,
    whatsapp_number: productForSale.whatsapp_number ?? integrations?.whatsapp_number ?? null,
    sale_mode: canReserveOnline ? "booking" : "whatsapp",
  } as Product & { rates?: ProductRate[] };

  const approvedReviews = reviews ?? [];
  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / approvedReviews.length
      : 0;
  const productJsonLd = buildProductJsonLd({
    product: productForSale,
    images,
    rate,
    baseUrl: seo?.canonicalBaseUrl,
    ratingValue: avgRating,
    reviewCount: approvedReviews.length,
  });

  return (
    <main className="bg-gray-50 text-gray-900">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <div className="border-b border-gray-100 bg-white py-4 text-sm text-gray-500">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
          <ArrowRight className="h-3 w-3" />
          <span>{category}</span>
          <ArrowRight className="h-3 w-3" />
          <span className="max-w-[220px] truncate font-medium text-gray-800 md:max-w-none">{p.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-7">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {category}
            </span>
            {extra.highlights.slice(0, 2).map((item) => (
              <span key={item} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Check className="h-3 w-3" /> {item}
              </span>
            ))}
          </div>
          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-gray-950 md:text-5xl">{p.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {extra.location && <MetaPill icon={MapPin} label={extra.location} />}
            {extra.duration && <MetaPill icon={Clock} label={extra.duration} />}
            {extra.guideLanguages.length > 0 && <MetaPill icon={Languages} label={extra.guideLanguages.join(", ")} />}
            {approvedReviews.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                <Star className="h-4 w-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                {avgRating.toFixed(1)} de {approvedReviews.length} avaliacoes
              </span>
            )}
          </div>
        </header>

        <ProductGallery images={images} title={p.title} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            <InfoPanel title="Informacao geral" icon={Map}>
              <p className="whitespace-pre-line text-base leading-relaxed text-gray-600">
                {p.description || "Produto cadastrado pelo tenant. Use o painel para completar a descricao comercial."}
              </p>
            </InfoPanel>

            <ProductSpecs product={p} extra={extra} />

            {(extra.included.length > 0 || extra.notIncluded.length > 0) && (
              <InfoPanel title="O que inclui / nao inclui" icon={Check} muted>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {extra.included.length > 0 && <InfoList items={extra.included} icon={Check} color="text-emerald-600" />}
                  {extra.notIncluded.length > 0 && <InfoList items={extra.notIncluded} icon={X} color="text-red-400" />}
                </div>
              </InfoPanel>
            )}

            {extra.importantInfo && (
              <InfoPanel title="Antes de participar" icon={AlertCircle}>
                <div className="rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 p-4 text-sm leading-relaxed text-gray-700">
                  {extra.importantInfo}
                </div>
              </InfoPanel>
            )}

            {extra.cancellationPolicy && (
              <InfoPanel title="Politica de cancelamento" icon={ShieldCheck}>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{extra.cancellationPolicy}</p>
              </InfoPanel>
            )}

            {extra.itinerary.length > 0 && (
              <InfoPanel title="Roteiro" icon={Calendar}>
                <div className="relative ml-3 space-y-8 border-l-2 border-[var(--color-primary)]/20 pb-2">
                  {extra.itinerary.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="relative ml-8">
                      <span className="absolute -left-[43px] top-0 rounded-full border-4 border-[var(--color-primary)]/20 bg-white p-2 text-[var(--color-primary)] shadow-sm">
                        <Map className="h-4 w-4" />
                      </span>
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {item.time && <span className="w-fit rounded bg-[var(--color-secondary)] px-2 py-1 text-xs font-bold text-white">{item.time}</span>}
                        <h3 className="text-lg font-bold text-gray-800">{item.title || `Etapa ${index + 1}`}</h3>
                      </div>
                      {item.description && <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </InfoPanel>
            )}

            {approvedReviews.length > 0 && <ReviewsSection reviews={approvedReviews} avgRating={avgRating} />}
          </div>

          <aside>
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
              <div className="p-5 text-white" style={{ backgroundColor: secondaryColor }}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">A partir de</p>
                {rate ? (
                  <>
                    <p className="text-3xl font-bold">{formatCurrency(rate.price, rate.currency)}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {priceSupportLine(rate, canReserveOnline, hasConnectedPayment)}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold">Consultar tarifa</p>
                )}
              </div>
              <div className="space-y-5 p-6">
                {publicRates.length > 0 && (
                  <RateList rates={publicRates} primaryColor={primaryColor} />
                )}
                <CheckoutStatus
                  canReserveOnline={canReserveOnline}
                  hasConnectedPayment={hasConnectedPayment}
                  hasRates={publicRates.length > 0}
                  bookingEngineAllowed={bookingEngineAllowed}
                />
                <BookingWidget
                  product={actionProduct}
                  theme={t}
                  tenantId={tenantId ?? ""}
                  embedded
                  hasOnlinePayment={hasConnectedPayment}
                />
                <LeadCaptureForm tenantId={tenantId ?? ""} productId={p.id} primaryColor={primaryColor} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildProductJsonLd({
  product,
  images,
  rate,
  baseUrl,
  ratingValue,
  reviewCount,
}: {
  product: PublicProduct;
  images: string[];
  rate: ProductRate | null;
  baseUrl?: string;
  ratingValue: number;
  reviewCount: number;
}) {
  if (!baseUrl) return null;
  const imageUrls = images
    .map((image) => absoluteUrl(baseUrl, image))
    .filter((image): image is string => Boolean(image));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.seo_title ?? product.title,
    description: product.seo_description ?? product.description,
    image: imageUrls,
    category: productCategoryLabel(product),
    url: canonicalUrl(baseUrl, `/produto/${product.slug}`),
    ...(rate
      ? {
          offers: {
            "@type": "Offer",
            price: rate.price,
            priceCurrency: rate.currency,
            availability: "https://schema.org/InStock",
            url: canonicalUrl(baseUrl, `/produto/${product.slug}`),
          },
        }
      : {}),
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRound(ratingValue)),
            reviewCount,
          },
        }
      : {}),
  };
}

function avgRound(value: number) {
  return value.toFixed(1);
}

function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const slots = [0, 1, 2, 3, 4].map((index) => images[index] ?? images[0]);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg">
      <div className="grid h-[320px] grid-cols-1 gap-2 bg-white md:h-[450px] md:grid-cols-4">
        <ImageTile src={slots[0]} alt={title} className="md:col-span-2" priority />
        <div className="hidden h-full flex-col gap-2 md:flex">
          <ImageTile src={slots[1]} alt={`${title} foto 2`} />
          <ImageTile src={slots[2]} alt={`${title} foto 3`} />
        </div>
        <div className="relative hidden h-full flex-col gap-2 md:flex">
          <ImageTile src={slots[3]} alt={`${title} foto 4`} />
          <ImageTile src={slots[4]} alt={`${title} foto 5`} />
          <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">
            <ImageIcon className="h-4 w-4" /> {images.length} fotos
          </span>
        </div>
      </div>
    </div>
  );
}

function ImageTile({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`relative h-full min-h-0 overflow-hidden bg-gray-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}

function ProductSpecs({ product, extra }: { product: PublicProduct; extra: ReturnType<typeof productExtra> }) {
  const specs =
    product.module === "hospedagem"
      ? [
          extra.capacity ? { icon: Users, label: extra.capacity, title: "Capacidade" } : null,
          extra.bedrooms ? { icon: BedDouble, label: extra.bedrooms, title: "Quartos" } : null,
          extra.bathrooms ? { icon: Bath, label: extra.bathrooms, title: "Banheiros" } : null,
        ]
      : [
          extra.capacity ? { icon: Users, label: extra.capacity, title: productCapacityTitle(product) } : null,
          extra.duration ? { icon: Clock, label: extra.duration, title: "Duracao" } : null,
          extra.location ? { icon: MapPin, label: extra.location, title: "Destino" } : null,
          extra.guideLanguages.length ? { icon: Languages, label: extra.guideLanguages.join(", "), title: "Idiomas" } : null,
        ];
  const visible = specs.filter(Boolean) as { icon: LucideIcon; label: string; title: string }[];
  if (!visible.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {visible.map(({ icon: Icon, label, title }) => (
        <div key={title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Icon className="mb-4 h-5 w-5 text-[var(--color-primary)]" />
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
          <p className="mt-1 font-semibold text-gray-900">{label}</p>
        </div>
      ))}
    </div>
  );
}

function productCapacityTitle(product: PublicProduct): string {
  if (product.type === "ingresso") return "Limite";
  if (product.type === "transporte") return "Capacidade";
  if (product.module === "emissivo") return "Grupo";
  return "Vagas";
}

function priceSupportLine(rate: ProductRate, canReserveOnline: boolean, hasConnectedPayment: boolean): string {
  const suffix = rateSuffix(rate) || "/ reserva";
  if (canReserveOnline && hasConnectedPayment) return `${suffix} com pagamento online`;
  if (canReserveOnline) return `${suffix} com pagamento a combinar`;
  return `${suffix} - tarifa de referencia`;
}

function InfoPanel({
  title,
  icon: Icon,
  children,
  muted = false,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${muted ? "bg-gray-50/50" : ""}`}>
      <div className="border-b border-gray-100 p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <Icon className="h-6 w-6 text-[var(--color-primary)]" /> {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function InfoList({ items, icon: Icon, color }: { items: string[]; icon: LucideIcon; color: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm font-medium text-gray-700">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} strokeWidth={3} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RateList({ rates, primaryColor }: { rates: ProductRate[]; primaryColor: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-800">Tarifas cadastradas</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500">
          {rates.length} {rates.length === 1 ? "opcao" : "opcoes"}
        </span>
      </div>
      {rates.slice(0, 5).map((rate) => (
        <div key={rate.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-800">{rate.name}</p>
              <p className="text-xs text-gray-400">
                {rate.season_name || "Tarifa disponivel"}
                {rate.valid_from && rate.valid_to ? `, ${formatDate(rate.valid_from)} ate ${formatDate(rate.valid_to)}` : ""}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {rate.occupancy_min}-{rate.occupancy_max} pessoas {rateSuffix(rate) || "/ reserva"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: primaryColor }}>{formatCurrency(rate.price, rate.currency)}</p>
              <p className="text-[11px] text-gray-400">{rateSuffix(rate) || "total"}</p>
            </div>
          </div>
        </div>
      ))}
      {rates.length > 5 && <p className="text-xs text-gray-400">Mais tarifas podem aparecer conforme a data escolhida.</p>}
    </div>
  );
}

function CheckoutStatus({
  canReserveOnline,
  hasConnectedPayment,
  hasRates,
  bookingEngineAllowed,
}: {
  canReserveOnline: boolean;
  hasConnectedPayment: boolean;
  hasRates: boolean;
  bookingEngineAllowed: boolean;
}) {
  if (canReserveOnline && hasConnectedPayment) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <p className="font-semibold">Checkout online ativo</p>
        <p className="mt-1 text-xs">O cliente reserva, paga online e a reserva entra no sistema.</p>
      </div>
    );
  }

  if (canReserveOnline) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
        <p className="font-semibold">Reserva online ativa</p>
        <p className="mt-1 text-xs">A reserva entra no sistema; o pagamento fica para combinar com a equipe.</p>
      </div>
    );
  }

  const reason = !bookingEngineAllowed
    ? "Plano atual sem motor de reservas online."
    : !hasRates
      ? "Sem tarifas cadastradas para reserva online."
      : "Produto configurado para consulta.";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-semibold">Consulta comercial</p>
      <p className="mt-1 text-xs">{reason} As tarifas podem aparecer como referencia, mas a compra fecha por atendimento.</p>
    </div>
  );
}

function ReviewsSection({ reviews, avgRating }: { reviews: { id: string; customer_name: string; rating: number | null; body: string | null }[]; avgRating: number }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Avaliacoes de quem ja viveu essa experiencia</h2>
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded bg-[var(--color-secondary)] px-2 py-1 text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
        <StarRow rating={avgRating} />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-xl border border-gray-100 p-5">
            <StarRow rating={review.rating ?? 0} />
            {review.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">&ldquo;{review.body}&rdquo;</p>}
            <p className="mt-4 text-sm font-bold text-gray-800">{review.customer_name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((item) => (
        <Star key={item} className={`h-4 w-4 ${rating >= item ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" /> {label}
    </span>
  );
}
