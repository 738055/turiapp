import { Star } from "lucide-react";
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

export function TestimonialsSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as TestimonialsConfig;
  const items = cfg.items ?? [];

  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32rem)]" />
      <div className="relative mx-auto max-w-7xl">
        {cfg.title && (
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Prova social</p>
            <h2 className="text-3xl font-extrabold md:text-4xl">{cfg.title}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((testimonial, index) => (
            <article key={`${testimonial.name}-${index}`} className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star < testimonial.rating ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-white/25"}`}
                  />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-white/80">&ldquo;{testimonial.text}&rdquo;</p>
              <p className="text-sm font-bold text-white">{testimonial.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
