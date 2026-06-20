import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { getCachedPublicTheme } from "@/lib/public-cache";
import { canonicalUrl, resolveTenantSeoContext } from "@/lib/seo/tenant";
import { lowestRate, type PublicProduct } from "@/lib/storefront-design";
import { StorefrontProductCard } from "@/components/sections/ProductGridSection";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  modulo?: string;
  preco_max?: string;
  pessoas?: string;
  ordenar?: string;
}

type ModuleFilter = "hospedagem" | "receptivo" | "emissivo";

const MODULE_OPTIONS: { value: ModuleFilter; label: string }[] = [
  { value: "hospedagem", label: "Hospedagem" },
  { value: "receptivo", label: "Experiencias e passeios" },
  { value: "emissivo", label: "Pacotes e viagens" },
];

const SORTS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "menor_preco", label: "Menor preco" },
  { value: "recentes", label: "Mais recentes" },
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) return { robots: { index: false, follow: false } };

  const seo = await resolveTenantSeoContext(tenantId, headersList);
  if (!seo) return { robots: { index: false, follow: false } };

  const hasFilters = Object.values(sp).some((value) => typeof value === "string" && value.trim().length > 0);
  const title = hasFilters ? `Resultados de busca | ${seo.tenant.name}` : `Busca | ${seo.tenant.name}`;
  const description = `Encontre produtos, pacotes, hospedagens e experiencias de ${seo.tenant.name}.`;

  return {
    metadataBase: new URL(seo.canonicalBaseUrl),
    title,
    description,
    alternates: { canonical: "/busca" },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: seo.tenant.name,
      title,
      description,
      url: canonicalUrl(seo.canonicalBaseUrl, "/busca"),
    },
  };
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const q = (sp.q ?? "").trim();
  const requestedModulo = sp.modulo ?? "";
  const precoMax = sp.preco_max ? Number(sp.preco_max) : null;
  const pessoas = sp.pessoas ? Number(sp.pessoas) : null;
  const ordenar = sp.ordenar ?? "relevancia";

  const service = createServiceClient();
  const [moduleRows, theme] = await Promise.all([
    service
      .from("products")
      .select("module")
      .eq("tenant_id", tenantId ?? "")
      .eq("status", "published"),
    getCachedPublicTheme(tenantId ?? ""),
  ]);
  const availableModuleValues = new Set(
    (moduleRows.data ?? [])
      .map((row) => row.module)
      .filter((module): module is ModuleFilter => isModuleFilter(module))
  );
  const availableModules = MODULE_OPTIONS.filter((module) => availableModuleValues.has(module.value));
  const modulo = isModuleFilter(requestedModulo) && availableModuleValues.has(requestedModulo) ? requestedModulo : "";
  let query = service
    .from("products")
    .select("*, rates:product_rates(*)")
    .eq("tenant_id", tenantId ?? "")
    .eq("status", "published");

  if (modulo) query = query.eq("module", modulo);

  const safeQ = q.replace(/[,()*%.\\:]/g, " ").trim();
  if (safeQ) query = query.or(`title.ilike.*${safeQ}*,description.ilike.*${safeQ}*`);

  const { data } = await query.limit(200);
  let results = (data ?? []) as PublicProduct[];

  if (precoMax !== null) {
    results = results.filter((product) => {
      const rate = lowestRate(product);
      return rate ? rate.price <= precoMax : false;
    });
  }

  if (pessoas !== null) {
    results = results.filter((product) =>
      (product.rates ?? []).some((rate) => rate.occupancy_min <= pessoas && rate.occupancy_max >= pessoas)
    );
  }

  if (ordenar === "menor_preco") {
    results.sort((a, b) => (lowestRate(a)?.price ?? Infinity) - (lowestRate(b)?.price ?? Infinity));
  } else if (ordenar === "recentes") {
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const inputCls = "h-11 w-full rounded-[var(--radius,0.5rem)] border border-gray-200 bg-white px-3 text-sm";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">Busca</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Encontre a melhor experiencia</h1>
      </div>

      <form action="/busca" method="GET" className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="flex items-center gap-2 rounded-[var(--radius,0.5rem)] border border-gray-200 bg-white px-3 md:col-span-4">
          <Search className="h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="O que voce procura?" className="h-11 flex-1 border-0 bg-transparent text-sm focus:outline-none" />
        </div>
        <select name="modulo" defaultValue={modulo} className={`md:col-span-3 ${inputCls}`}>
          <option value="">Todos os tipos</option>
          {availableModules.map((module) => <option key={module.value} value={module.value}>{module.label}</option>)}
        </select>
        <input name="preco_max" type="number" min="0" defaultValue={sp.preco_max ?? ""} placeholder="Preco max. (R$)" className={`md:col-span-2 ${inputCls}`} />
        <input name="pessoas" type="number" min="1" defaultValue={sp.pessoas ?? ""} placeholder="Pessoas" className={`md:col-span-1 ${inputCls}`} />
        <select name="ordenar" defaultValue={ordenar} className={`md:col-span-2 ${inputCls}`}>
          {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
        </select>
        <div className="md:col-span-12">
          <button type="submit" className="h-11 rounded-[var(--radius,0.5rem)] bg-[var(--color-primary)] px-6 text-sm font-semibold text-white">
            Buscar
          </button>
        </div>
      </form>

      <p className="mb-4 text-sm text-gray-500">
        {results.length} {results.length === 1 ? "resultado" : "resultados"}
        {q && <> para &ldquo;<strong>{q}</strong>&rdquo;</>}
      </p>

      {results.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <p className="mt-1 text-sm">Tente ajustar os filtros ou buscar por outro termo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {results.map((product, index) => (
            <StorefrontProductCard
              key={product.id}
              product={product}
              theme={theme}
              cardType={theme?.card_type ?? "card-image-large"}
              layout="horizontal"
              variant={product.module === "hospedagem" ? "editorial" : "marketplace"}
              priority={index < 2}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function isModuleFilter(value: unknown): value is ModuleFilter {
  return MODULE_OPTIONS.some((module) => module.value === value);
}
