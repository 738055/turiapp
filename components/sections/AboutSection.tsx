import Image from "next/image";
import type { PageSection, Theme } from "@/types";

interface AboutConfig { title?: string; text?: string; image_url?: string; eyebrow?: string }

export function AboutSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as AboutConfig;
  const hasImage = Boolean(cfg.image_url);

  return (
    <section className="w-full bg-[var(--color-background)] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 lg:gap-16">
        {hasImage && (
          <div className="tf-reveal-zoom relative order-2 aspect-[4/5] w-full overflow-hidden rounded-[calc(var(--radius)*1.5)] shadow-2xl ring-1 ring-black/5 md:order-1">
            <Image src={cfg.image_url as string} alt={cfg.title ?? ""} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-white/15 p-5 text-white shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Curadoria</p>
              <p className="mt-1 text-lg font-bold">Experiencias prontas para vender</p>
            </div>
          </div>
        )}
        <div className={hasImage ? "order-1 md:order-2" : "mx-auto max-w-3xl text-center md:col-span-2"}>
          <div className={`tf-reveal mb-5 flex items-center gap-3 ${hasImage ? "" : "justify-center"}`}>
            <span className="h-px w-8 bg-[var(--color-accent)]" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-accent)]">{cfg.eyebrow ?? "Sobre"}</p>
          </div>
          {cfg.title && (
            <h2 className="tf-reveal tf-delay-1 max-w-3xl text-4xl font-semibold leading-[1.1] text-[var(--color-text)] md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {cfg.title}
            </h2>
          )}
          {cfg.text && (
            <p className={`tf-reveal tf-delay-2 mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-[var(--color-text)]/70 ${hasImage ? "" : "mx-auto"}`}>
              {cfg.text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
