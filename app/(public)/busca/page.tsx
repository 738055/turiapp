import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  modulo?: string;
  preco_max?: string;
  pessoas?: string;
  ordenar?: string;
}

const MODULES = [
  { value: "", label: "Todos os tipos" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "receptivo", label: "Experiências e passeios" },
  { value: "emissivo", label: "Pacotes e viagens" },
];

const SORTS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor_preco", label: "Menor preço" },
  { value: "recentes", label: "Mais recentes" },
];

type ProductWithRates = Product & { rates?: { price: number; currency: string; occupancy_min: number; occupancy_max: number }[] };

function lowestRate(p: ProductWithRates) {
  if (!p.rates?.length) return null;
  return p.rates.reduce((min, r) => (r.price < min.price ? r : min), p.rates[0]);
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const q = (sp.q ?? "").trim();
  const modulo = sp.modulo ?? "";
  const precoMax = sp.preco_max ? Number(sp.preco_max) : null;
  const pessoas = sp.pessoas ? Number(sp.pessoas) : null;
  const ordenar = sp.ordenar ?? "relevancia";

  const service = createServiceClient();
  let query = service
    .from("products")
    .select("*, rates:product_rates(price, currency, occupancy_min, occupancy_max)")
    .eq("tenant_id", tenantId ?? "")
    .eq("status", "published");

  if (modulo) query = query.eq("module", modulo);
  // Text search on title/description (case-insensitive). PostgREST uses `*` as the
  // ilike wildcard. We strip characters that are significant inside an or() filter
  // (commas, parens, dots, * %) so user input can't alter the filter structure —
  // an injection guard. For very large catalogs this should move to tsvector+GIN.
  const safeQ = q.replace(/[,()*%.\\:]/g, " ").trim();
  if (safeQ) query = query.or(`title.ilike.*${safeQ}*,description.ilike.*${safeQ}*`);

  const { data } = await query.limit(200);
  let results = (data ?? []) as ProductWithRates[];

  // Price + occupancy filters need the rate join, so apply them in memory.
  if (precoMax !== null) {
    results = results.filter((p) => {
      const lr = lowestRate(p);
      return lr ? lr.price <= precoMax : false;
    });
  }
  if (pessoas !== null) {
    results = results.filter((p) =>
      (p.rates ?? []).some((r) => r.occupancy_min <= pessoas && r.occupancy_max >= pessoas)
    );
  }

  if (ordenar === "menor_preco") {
    results.sort((a, b) => (lowestRate(a)?.price ?? Infinity) - (lowestRate(b)?.price ?? Infinity));
  } else if (ordenar === "recentes") {
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const inputCls = "h-11 w-full rounded-[var(--radius,0.5rem)] border border-gray-200 bg-white px-3 text-sm";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-5">Buscar</h1>

      {/* Filter form — GET so the URL is shareable */}
      <form action="/busca" method="GET" className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
        <div className="md:col-span-4 flex items-center gap-2 bg-white border border-gray-200 rounded-[var(--radius,0.5rem)] px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="O que você procura?" className="flex-1 h-11 border-0 text-sm focus:outline-none bg-transparent" />
        </div>
        <select name="modulo" defaultValue={modulo} className={`md:col-span-3 ${inputCls}`}>
          {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input name="preco_max" type="number" min="0" defaultValue={sp.preco_max ?? ""} placeholder="Preço máx. (R$)" className={`md:col-span-2 ${inputCls}`} />
        <input name="pessoas" type="number" min="1" defaultValue={sp.pessoas ?? ""} placeholder="Pessoas" className={`md:col-span-1 ${inputCls}`} />
        <select name="ordenar" defaultValue={ordenar} className={`md:col-span-2 ${inputCls}`}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="md:col-span-12">
          <button type="submit" className="h-11 px-6 rounded-[var(--radius,0.5rem)] text-white text-sm font-semibold" style={{ backgroundColor: "var(--color-primary)" }}>
            Buscar
          </button>
        </div>
      </form>

      <p className="text-sm text-gray-500 mb-4">
        {results.length} {results.length === 1 ? "resultado" : "resultados"}
        {q && <> para &ldquo;<strong>{q}</strong>&rdquo;</>}
      </p>

      {results.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((p) => {
            const lr = lowestRate(p);
            return (
              <Link key={p.id} href={`/produto/${p.slug}`} className="group rounded-[var(--radius)] border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">🏖️</div>
                  )}
                  <span className="absolute top-3 left-3 text-xs bg-white/90 rounded-full px-2 py-0.5 capitalize">{p.type}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 leading-snug mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
                  {lr && (
                    <p className="mt-3 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                      A partir de {formatCurrency(lr.price, lr.currency)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
