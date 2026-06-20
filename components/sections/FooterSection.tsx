import type { PageSection, Theme } from "@/types";

interface FooterConfig {
  company_name?: string;
  description?: string;
  links?: { label: string; href: string }[];
  social?: { instagram?: string; facebook?: string; tiktok?: string };
}

export function FooterSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as FooterConfig;
  const year = new Date().getFullYear();
  const links = cfg.links?.length
    ? cfg.links
    : [
        { label: "Produtos", href: "/busca" },
        { label: "FAQ", href: "/faq" },
        { label: "Termos", href: "/termos" },
        { label: "Privacidade", href: "/privacidade" },
      ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--color-secondary)] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          {cfg.company_name && <p className="mb-3 text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{cfg.company_name}</p>}
          {cfg.description && <p className="max-w-md text-sm leading-relaxed text-white/65">{cfg.description}</p>}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
          {links.map((link) => (
            <a key={`${link.href}-${link.label}`} href={link.href} className="text-sm font-medium text-white/65 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-xs text-white/45">
        &copy; {year} {cfg.company_name ?? "TuriApp"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
