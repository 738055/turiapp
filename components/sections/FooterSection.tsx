import type { PageSection, Theme } from "@/types";

interface FooterConfig {
  company_name?: string;
  description?: string;
  links?: { label: string; href: string }[];
  social?: { instagram?: string; facebook?: string; tiktok?: string }
}

export function FooterSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as FooterConfig;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-10 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          {cfg.company_name && <p className="font-bold text-gray-900 mb-1">{cfg.company_name}</p>}
          {cfg.description && <p className="text-sm text-gray-500 max-w-xs">{cfg.description}</p>}
        </div>
        {cfg.links?.length && (
          <div className="flex flex-wrap gap-4">
            {cfg.links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-gray-900">{l.label}</a>
            ))}
          </div>
        )}
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        © {year} {cfg.company_name ?? "TuriApp"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
