import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { PageSection, Theme } from "@/types";

interface BannerConfig {
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  bg_color?: string;
  variant?: "solid" | "glass" | "editorial";
}

export function BannerSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as BannerConfig;
  const variant = cfg.variant ?? "glass";
  const bgColor = cfg.bg_color ?? "var(--color-secondary)";

  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className={`relative mx-auto max-w-7xl overflow-hidden ${variant === "editorial" ? "rounded-none" : "rounded-2xl"}`} style={{ backgroundColor: bgColor }}>
        {cfg.image_url && (
          <Image src={cfg.image_url} alt="" fill className="object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />
        <div className="relative grid items-center gap-8 p-8 md:grid-cols-[minmax(0,1fr)_320px] md:p-12">
          <div>
            {cfg.title && <h2 className="max-w-2xl text-3xl font-bold leading-tight text-white md:text-5xl">{cfg.title}</h2>}
            {cfg.subtitle && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">{cfg.subtitle}</p>}
          </div>
          <div className={variant === "glass" ? "rounded-2xl border border-white/15 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md" : "text-white md:text-right"}>
            <p className="mb-4 text-sm text-white/70">Atendimento personalizado para sua viagem</p>
            {cfg.cta_label && cfg.cta_href && (
              <Button asChild className="w-full bg-[var(--color-accent)] text-white hover:brightness-95 md:w-auto">
                <a href={cfg.cta_href}>{cfg.cta_label}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
