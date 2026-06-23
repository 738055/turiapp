import { Quote, Star } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface Testimonial {
  name: string;
  text: string;
  rating: number;
  avatar?: string;
}

interface TestimonialsConfig {
  title?: string;
  items?: Testimonial[];
}

const DELAYS = ["", "tf-delay-1", "tf-delay-2", "tf-delay-3", "tf-delay-4", "tf-delay-5"];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialsSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as TestimonialsConfig;
  const items = (cfg.items ?? []).filter((item) => item.name?.trim() || item.text?.trim());

  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34rem)]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[var(--color-accent)]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {cfg.title && (
          <div className="tf-reveal mb-12 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Prova social</p>
            <h2 className="text-3xl font-extrabold md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>{cfg.title}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((testimonial, index) => (
            <article
              key={`${testimonial.name}-${index}`}
              className={`tf-reveal ${DELAYS[index] ?? ""} flex flex-col rounded-2xl border border-white/15 bg-white/[0.07] p-7 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/[0.1]`}
            >
              <Quote className="mb-4 h-7 w-7 text-[var(--color-accent)]/70" />
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star < testimonial.rating ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-white/25"}`}
                  />
                ))}
              </div>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-white/85">&ldquo;{testimonial.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                  {initials(testimonial.name)}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{testimonial.name}</p>
                  <p className="text-xs text-white/50">Cliente verificado</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
