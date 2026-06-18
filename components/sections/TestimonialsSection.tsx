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
    <section className="py-12 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {cfg.title && <h2 className="text-3xl font-bold text-center mb-8">{cfg.title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-[var(--radius)] p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} className={j < t.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                ))}
              </div>
              <p className="text-gray-600 text-sm italic mb-4">&ldquo;{t.text}&rdquo;</p>
              <p className="text-sm font-semibold text-gray-800">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
