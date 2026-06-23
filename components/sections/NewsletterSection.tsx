import { Mail, Send } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface NewsletterConfig { title?: string; subtitle?: string; btn_label?: string }

export function NewsletterSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as NewsletterConfig;
  return (
    <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div
        className="tf-reveal relative mx-auto max-w-5xl overflow-hidden rounded-[calc(var(--radius)*1.6)] px-6 py-14 text-center shadow-xl sm:px-12"
        style={{ backgroundImage: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[var(--color-accent)]/25 blur-3xl tf-glow" />

        <div className="relative mx-auto max-w-xl">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md">
            <Mail className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            {cfg.title ?? "Receba novidades e ofertas exclusivas"}
          </h2>
          {cfg.subtitle && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 md:text-base">{cfg.subtitle}</p>}

          <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/25 backdrop-blur-md sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
            >
              {cfg.btn_label ?? "Inscrever"} <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
