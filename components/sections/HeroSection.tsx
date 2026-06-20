import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { PageSection, Theme } from "@/types";

interface HeroConfig {
  variant?: "classic" | "marketplace" | "editorial";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  overlay_opacity?: number;
  height?: "sm" | "md" | "lg" | "full";
  align?: "left" | "center" | "right";
  stats?: { value: string; label: string }[];
}

const heightMap = {
  sm: "min-h-[40vh]",
  md: "min-h-[60vh]",
  lg: "min-h-[80vh]",
  full: "min-h-screen",
};

const statsGridMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export function HeroSection({
  section,
}: {
  section: PageSection;
  theme: Theme | null;
  tenantId: string;
}) {
  const cfg = (section.config ?? {}) as HeroConfig;
  const variant = cfg.variant ?? "classic";
  const height = heightMap[cfg.height ?? "md"];
  const align = cfg.align ?? "center";
  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <section
      className={`relative flex flex-col justify-center overflow-hidden px-6 py-16 ${height}`}
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {cfg.image_url && (
        <>
          <Image
            src={cfg.image_url}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                variant === "editorial"
                  ? "linear-gradient(90deg, rgba(15,30,22,.86), rgba(15,30,22,.32), rgba(15,30,22,.62))"
                  : variant === "marketplace"
                  ? "linear-gradient(90deg, rgba(2,6,23,.78), rgba(2,6,23,.42))"
                  : "rgb(0 0 0)",
              opacity: variant === "classic" ? cfg.overlay_opacity ?? 0.4 : 1,
            }}
          />
        </>
      )}
      <div className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col ${alignClass} gap-4`}>
        {cfg.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            {cfg.eyebrow}
          </p>
        )}
        {cfg.title && (
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white drop-shadow md:text-6xl">
            {cfg.title}
          </h1>
        )}
        {cfg.subtitle && (
          <p className="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow">
            {cfg.subtitle}
          </p>
        )}
        {cfg.cta_label && cfg.cta_href && (
          <Button
            asChild
            size="lg"
            className="mt-2 w-fit"
            style={{ backgroundColor: "var(--color-accent)", color: "#000" }}
          >
            <a href={cfg.cta_href}>{cfg.cta_label}</a>
          </Button>
        )}
        {!!cfg.stats?.length && (
          <div className={`mt-8 grid w-full max-w-3xl ${statsGridMap[Math.min(cfg.stats.length, 3)]} divide-x divide-white/15 border-y border-white/15 bg-white/5 backdrop-blur-sm`}>
            {cfg.stats.slice(0, 3).map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="px-4 py-3">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
