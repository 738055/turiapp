import type { Product, ProductRate } from "@/types";

export interface ProductExtraView {
  duration?: string;
  location?: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  itinerary: { title?: string; description?: string; time?: string }[];
  importantInfo?: string;
  cancellationPolicy?: string;
  gallery: string[];
  capacity?: string;
  bedrooms?: string;
  bathrooms?: string;
  guideLanguages: string[];
}

export type PublicProduct = Product & { rates?: ProductRate[] };

export function productExtra(product: Pick<Product, "extra_data">): ProductExtraView {
  const extra = (product.extra_data ?? {}) as Record<string, unknown>;
  return {
    duration: stringValue(extra.duration),
    location: stringValue(extra.location),
    highlights: stringArray(extra.highlights),
    included: stringArray(extra.included),
    notIncluded: stringArray(extra.not_included),
    itinerary: itineraryArray(extra.itinerary),
    importantInfo: stringValue(extra.important_info),
    cancellationPolicy: stringValue(extra.cancellation_policy),
    gallery: stringArray(extra.gallery),
    capacity: stringValue(extra.capacity),
    bedrooms: stringValue(extra.bedrooms),
    bathrooms: stringValue(extra.bathrooms),
    guideLanguages: stringArray(extra.guide_languages),
  };
}

export function productImages(product: Pick<Product, "images" | "module" | "type" | "extra_data">): string[] {
  const extra = productExtra(product);
  const images = [...(product.images ?? []), ...extra.gallery].filter(Boolean);
  return images.length ? images : [placeholderImage(product.module, product.type)];
}

export function placeholderImage(module?: string, type?: string): string {
  if (module === "hospedagem") {
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
  }
  if (module === "emissivo") {
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";
  }
  if (type === "transporte" || type === "city-tour") {
    return "/storefront/receptivo/hero-cataratas.jpg";
  }
  return "/storefront/receptivo/hero-cataratas.jpg";
}

export function productCategoryLabel(product: Pick<Product, "module" | "type">): string {
  const labels: Record<string, string> = {
    hospedagem: "Hospedagem",
    receptivo: "Passeio local",
    emissivo: "Pacote de viagem",
    pousada: "Pousada",
    hotel: "Hotel",
    airbnb: "Temporada",
    chale: "Chale",
    "chalé": "Chale",
    resort: "Resort",
    ingresso: "Ingresso",
    experiencia: "Experiencia",
    transporte: "Transfer",
    "city-tour": "City tour",
    pacote: "Pacote",
    cruzeiro: "Cruzeiro",
    viagem: "Viagem",
  };
  return labels[product.type] ?? labels[product.module] ?? product.type ?? "Produto";
}

export function lowestRate(product: { rates?: ProductRate[] }): ProductRate | null {
  if (!product.rates?.length) return null;
  return product.rates.reduce((min, rate) => (rate.price < min.price ? rate : min), product.rates[0]);
}

export function rateSuffix(rate: Pick<ProductRate, "rate_type"> | null | undefined): string {
  if (!rate) return "";
  if (rate.rate_type === "per_night") return "/ noite";
  if (rate.rate_type === "per_person") return "/ pessoa";
  if (rate.rate_type === "per_group") return "/ grupo";
  return "";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function itineraryArray(value: unknown): ProductExtraView["itinerary"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): ProductExtraView["itinerary"][number] | null => {
      if (!item || typeof item !== "object") return null;
      const entry = item as { title?: unknown; description?: unknown; time?: unknown };
      return {
        title: stringValue(entry.title),
        description: stringValue(entry.description),
        time: stringValue(entry.time),
      };
    })
    .filter((item): item is ProductExtraView["itinerary"][number] => !!item && (!!item.title || !!item.description));
}
