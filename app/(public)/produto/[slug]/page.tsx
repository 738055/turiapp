import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { getCachedPublicProduct, getCachedPublicTheme } from "@/lib/public-cache";
import { formatCurrency } from "@/lib/utils";
import { BookingWidget } from "@/components/public/BookingWidget";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import type { Product, ProductRate, Theme } from "@/types";
import { Check, Clock, Info, MapPin, X } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface ProductExtraData {
  duration?: string;
  location?: string;
  highlights?: string[];
  included?: string[];
  not_included?: string[];
  itinerary?: { title?: string; description?: string }[];
  important_info?: string;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) return {};

  const supabase = createServiceClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, seo_title, seo_description, images")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!product) return {};

  return {
    title: product.seo_title ?? product.title,
    description: product.seo_description,
    openGraph: {
      title: product.seo_title ?? product.title,
      description: product.seo_description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const [product, theme] = await Promise.all([
    getCachedPublicProduct(tenantId ?? "", slug),
    getCachedPublicTheme(tenantId ?? ""),
  ]);

  if (!product) notFound();

  // Approved reviews for this product (read via service_role; pending/rejected
  // and token_hash never leave the server).
  const { data: reviews } = await createServiceClient()
    .from("reviews")
    .select("id, customer_name, rating, body, submitted_at")
    .eq("tenant_id", tenantId ?? "")
    .eq("product_id", (product as { id: string }).id)
    .eq("status", "approved")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(20);

  const approvedReviews = reviews ?? [];
  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / approvedReviews.length
      : 0;

  const p = product as unknown as Product & { rates: ProductRate[] };
  const t = theme as unknown as Theme | null;
  const extra = (p.extra_data ?? {}) as ProductExtraData;
  const highlights = stringArray(extra.highlights);
  const included = stringArray(extra.included);
  const notIncluded = stringArray(extra.not_included);
  const itinerary = Array.isArray(extra.itinerary) ? extra.itinerary.filter((item) => item.title || item.description) : [];
  const lowestRate = p.rates?.reduce(
    (min, r) => (r.price < min.price ? r : min),
    p.rates[0]
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          {p.images?.[0] ? (
            <div className="relative aspect-[4/3] rounded-[var(--radius,0.5rem)] overflow-hidden">
              <Image
                src={p.images[0]}
                alt={p.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-[var(--radius,0.5rem)] bg-gray-100 flex items-center justify-center text-6xl">
              🏖️
            </div>
          )}
          {p.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {p.images.slice(1, 5).map((img, i) => (
                <div key={i} className="relative aspect-square rounded overflow-hidden">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm capitalize text-gray-400 mb-1">{p.type?.replace("-", " ")}</p>
            <h1 className="text-3xl font-bold">{p.title}</h1>
            {approvedReviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={Math.round(avgRating) >= n ? "text-yellow-400" : "text-gray-200"}>★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {avgRating.toFixed(1)} · {approvedReviews.length} {approvedReviews.length === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>
            )}
            {lowestRate && (
              <p className="text-2xl font-bold mt-3" style={{ color: t?.primary_color ?? "#0ea5e9" }}>
                A partir de {formatCurrency(lowestRate.price, lowestRate.currency)}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  /{lowestRate.rate_type === "per_night" ? "noite" :
                    lowestRate.rate_type === "per_person" ? "pessoa" : "reserva"}
                </span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
              {extra.duration && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" /> {extra.duration}</span>}
              {extra.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" /> {extra.location}</span>}
            </div>
            {!!highlights.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <Check className="h-3.5 w-3.5" style={{ color: t?.primary_color ?? "#0ea5e9" }} /> {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {p.description && (
            <div>
              <h2 className="font-semibold mb-2">Sobre</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>
          )}

          {(included.length > 0 || notIncluded.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {included.length > 0 && (
                <InfoList title="Inclui" items={included} icon="check" />
              )}
              {notIncluded.length > 0 && (
                <InfoList title="Nao inclui" items={notIncluded} icon="x" />
              )}
            </div>
          )}

          {itinerary.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Roteiro</h2>
              <div className="space-y-3">
                {itinerary.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-[var(--radius,0.5rem)] border border-gray-100 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Etapa {index + 1}</p>
                    {item.title && <p className="mt-1 font-semibold text-gray-900">{item.title}</p>}
                    {item.description && <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {extra.important_info && (
            <div className="rounded-[var(--radius,0.5rem)] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-1 flex items-center gap-1.5 font-semibold"><Info className="h-4 w-4" /> Informacoes importantes</p>
              <p className="whitespace-pre-line leading-relaxed">{extra.important_info}</p>
            </div>
          )}

          {/* Rates table */}
          {p.rates?.length > 0 && p.sale_mode === "booking" && (
            <div>
              <h2 className="font-semibold mb-2">Tarifas disponíveis</h2>
              <div className="space-y-2">
                {p.rates.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-[var(--radius,0.5rem)] border p-3">
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      {r.season_name && (
                        <p className="text-xs text-gray-400">{r.season_name}</p>
                      )}
                      {r.valid_from && r.valid_to && (
                        <p className="text-xs text-gray-400">
                          {new Date(r.valid_from).toLocaleDateString("pt-BR")} –{" "}
                          {new Date(r.valid_to).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <p className="font-bold" style={{ color: t?.primary_color ?? "#0ea5e9" }}>
                      {formatCurrency(r.price, r.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <BookingWidget
            product={p}
            theme={t}
            tenantId={tenantId ?? ""}
          />

          <LeadCaptureForm
            tenantId={tenantId ?? ""}
            productId={p.id}
            primaryColor={t?.primary_color ?? "#0ea5e9"}
          />
        </div>
      </div>

      {approvedReviews.length > 0 && (
        <section className="mt-12 border-t pt-10">
          <h2 className="text-2xl font-bold mb-6">Avaliações de quem já viveu essa experiência</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {approvedReviews.map((r) => (
              <div key={r.id} className="rounded-[var(--radius,0.5rem)] border border-gray-100 bg-white p-5">
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={(r.rating ?? 0) >= n ? "text-yellow-400" : "text-gray-200"}>★</span>
                  ))}
                </div>
                {r.body && <p className="text-gray-600 text-sm leading-relaxed mb-3 whitespace-pre-line">&ldquo;{r.body}&rdquo;</p>}
                <p className="text-sm font-semibold text-gray-800">{r.customer_name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function InfoList({ title, items, icon }: { title: string; items: string[]; icon: "check" | "x" }) {
  const Icon = icon === "check" ? Check : X;
  const color = icon === "check" ? "text-green-600" : "text-gray-400";
  return (
    <div className="rounded-[var(--radius,0.5rem)] border border-gray-100 bg-white p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-gray-600">
            <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${color}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
