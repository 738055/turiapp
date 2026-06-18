import type { PageSection, Theme } from "@/types";
import { Search } from "lucide-react";

interface SearchConfig { title?: string; placeholder?: string }

export function SearchBarSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as SearchConfig;
  return (
    <section className="py-8 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {cfg.title && <h2 className="text-xl font-semibold text-center mb-4">{cfg.title}</h2>}
        <form action="/busca" method="GET" className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-[var(--radius)] px-4">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              name="q"
              type="text"
              placeholder={cfg.placeholder ?? "Buscar experiências, pousadas, passeios..."}
              className="flex-1 py-3 text-sm border-0 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-[var(--radius)] text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Buscar
          </button>
        </form>
      </div>
    </section>
  );
}
