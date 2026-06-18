import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { PageSection, Theme } from "@/types";

interface HeroConfig {
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  overlay_opacity?: number;
  height?: "sm" | "md" | "lg" | "full";
  align?: "left" | "center" | "right";
}

const heightMap = {
  sm: "min-h-[40vh]",
  md: "min-h-[60vh]",
  lg: "min-h-[80vh]",
  full: "min-h-screen",
};

export function HeroSection({
  section,
}: {
  section: PageSection;
  theme: Theme | null;
  tenantId: string;
}) {
  const cfg = (section.config ?? {}) as HeroConfig;
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
      className={`relative flex flex-col justify-center px-6 py-16 ${height}`}
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
            className="absolute inset-0 bg-black"
            style={{ opacity: cfg.overlay_opacity ?? 0.4 }}
          />
        </>
      )}
      <div className={`relative z-10 mx-auto max-w-4xl w-full flex flex-col ${alignClass} gap-4`}>
        {cfg.title && (
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow">
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
      </div>
    </section>
  );
}
