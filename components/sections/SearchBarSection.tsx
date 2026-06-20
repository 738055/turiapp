import { Search } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface SearchConfig {
  title?: string;
  placeholder?: string;
}

export function SearchBarSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as SearchConfig;

  return (
    <section className="relative z-10 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {cfg.title && <h2 className="mb-5 text-center text-xl font-bold text-gray-900">{cfg.title}</h2>}
        <form action="/busca" method="GET" className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-200/70 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 hover:bg-gray-50">
            <Search className="h-5 w-5 text-[var(--color-primary)]" />
            <input
              name="q"
              type="text"
              placeholder={cfg.placeholder ?? "Buscar experiencias, pousadas, passeios..."}
              className="flex-1 border-0 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white">
            Buscar
          </button>
        </form>
      </div>
    </section>
  );
}
