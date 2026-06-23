import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface BannerConfig {
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  bg_color?: string;
  eyebrow?: string;
  variant?: "solid" | "glass" | "editorial";
}

export function BannerSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as BannerConfig;
  const bgColor = cfg.bg_color ?? "var(--color-secondary)";

  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div
        className="tf-reveal relative mx-auto max-w-7xl overflow-hidden rounded-[calc(var(--radius)*1.5)] shadow-xl"
        style={{ backgroundColor: bgColor }}
      >
        {cfg.image_url && <Image src={cfg.image_url} alt="" fill className="object-cover opacity-30 tf-kenburns" />}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(120deg, rgba(0,0,0,0.55), rgba(0,0,0,0.18) 60%, transparent)" }} />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--color-accent)] opacity-20 blur-3xl tf-glow" />

        <div className="relative grid items-center gap-8 p-9 md:grid-cols-[minmax(0,1fr)_auto] md:p-14">
          <div className="max-w-2xl">
            {cfg.eyebrow && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                <Sparkles size={13} /> {cfg.eyebrow}
              </span>
            )}
            {cfg.title && (
              <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                {cfg.title}
              </h2>
            )}
            {cfg.subtitle && <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{cfg.subtitle}</p>}
          </div>
          {cfg.cta_label && cfg.cta_href && (
            <a
              href={cfg.cta_href}
              className="group inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-accent)] px-7 py-4 font-bold text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:brightness-105"
            >
              {cfg.cta_label}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
