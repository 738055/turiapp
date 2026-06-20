import Image from "next/image";
import type { PageSection, Theme } from "@/types";

interface AboutConfig { title?: string; text?: string; image_url?: string; eyebrow?: string }

export function AboutSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as AboutConfig;
  return (
    <section className="w-full bg-[var(--color-background)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        {cfg.image_url && (
          <div className="relative order-2 aspect-[4/5] w-full overflow-hidden rounded-[var(--radius)] shadow-xl md:order-1">
            <Image src={cfg.image_url} alt={cfg.title ?? ""} fill className="object-cover" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-white/15 p-5 text-white shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Curadoria</p>
              <p className="mt-1 text-lg font-bold">Experiencias prontas para vender</p>
            </div>
          </div>
        )}
        <div className={cfg.image_url ? "order-1 md:order-2" : "md:col-span-2"}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-accent)]">{cfg.eyebrow ?? "Sobre"}</p>
          {cfg.title && <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-[var(--color-text)] md:text-5xl">{cfg.title}</h2>}
          {cfg.text && <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-gray-600">{cfg.text}</p>}
        </div>
      </div>
    </section>
  );
}
