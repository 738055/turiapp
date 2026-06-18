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
}

export function BannerSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as BannerConfig;
  return (
    <section
      className="relative overflow-hidden rounded-2xl mx-6 my-8 p-10 flex flex-col md:flex-row items-center gap-8"
      style={{ backgroundColor: cfg.bg_color ?? "var(--color-accent)" }}
    >
      <div className="flex-1">
        {cfg.title && <h2 className="text-3xl font-bold text-white mb-2">{cfg.title}</h2>}
        {cfg.subtitle && <p className="text-white/90 mb-4">{cfg.subtitle}</p>}
        {cfg.cta_label && cfg.cta_href && (
          <Button asChild className="bg-white text-gray-900 hover:bg-gray-100">
            <a href={cfg.cta_href}>{cfg.cta_label}</a>
          </Button>
        )}
      </div>
      {cfg.image_url && (
        <div className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={cfg.image_url} alt="" fill className="object-cover" />
        </div>
      )}
    </section>
  );
}
