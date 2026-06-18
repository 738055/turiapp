import type { PageSection, Theme } from "@/types";

interface NewsletterConfig { title?: string; subtitle?: string; btn_label?: string }

export function NewsletterSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as NewsletterConfig;
  return (
    <section className="py-12 px-6" style={{ backgroundColor: "var(--color-primary)" }}>
      <div className="max-w-xl mx-auto text-center">
        {cfg.title && <h2 className="text-2xl font-bold text-white mb-2">{cfg.title}</h2>}
        {cfg.subtitle && <p className="text-white/80 mb-6 text-sm">{cfg.subtitle}</p>}
        <form className="flex gap-2">
          <input
            type="email"
            placeholder="Seu e-mail"
            className="flex-1 rounded-[var(--radius)] px-4 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-[var(--radius)] bg-white text-sm font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            {cfg.btn_label ?? "Inscrever"}
          </button>
        </form>
      </div>
    </section>
  );
}
