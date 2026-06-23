import { Search } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface SearchConfig {
  title?: string;
  placeholder?: string;
}

export function SearchBarSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as SearchConfig;

  return (
    <section className="relative z-20 w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {cfg.title && (
          <h2 className="mb-5 text-center text-xl font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-heading)" }}>
            {cfg.title}
          </h2>
        )}
        <form
          action="/busca"
          method="GET"
          className="tf-reveal group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-300/40 ring-1 ring-transparent transition focus-within:ring-[var(--color-primary)]/30 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors group-focus-within:bg-gray-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Search className="h-4 w-4" />
            </span>
            <input
              name="q"
              type="text"
              placeholder={cfg.placeholder ?? "Buscar experiencias, pousadas, passeios..."}
              className="flex-1 border-0 bg-transparent text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>
      </div>
    </section>
  );
}
