import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface PromoItem {
  image?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
}

interface PromosConfig {
  title?: string;
  subtitle?: string;
  items?: PromoItem[];
}

const DELAYS = ["", "tf-delay-1", "tf-delay-2", "tf-delay-3", "tf-delay-4", "tf-delay-5"];

function safeHref(href?: string): string {
  const clean = (href ?? "").trim();
  if (/^(https?:\/\/|\/|#)/i.test(clean)) return clean;
  return "/busca";
}

export function PromosSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as PromosConfig;
  const items = (cfg.items ?? []).filter((i) => i.title?.trim() || i.image?.trim() || i.badge?.trim());
  if (!items.length) return null;

  return (
    <section className="w-full bg-[var(--color-background)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {(cfg.title || cfg.subtitle) && (
          <div className="tf-reveal mb-9 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              {cfg.title && (
                <h2 className="text-3xl font-extrabold text-[var(--color-text)] md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                  {cfg.title}
                </h2>
              )}
              {cfg.subtitle && <p className="mt-2 text-base text-[var(--color-text)]/60">{cfg.subtitle}</p>}
            </div>
            <span className="hidden h-1 w-20 rounded-full bg-[var(--color-accent)] sm:block" />
          </div>
        )}

        {/* Horizontal scroll on mobile, responsive grid on larger screens. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {items.map((promo, i) => (
            <PromoCard key={`${promo.title}-${i}`} promo={promo} delay={DELAYS[i] ?? ""} priority={i < 3} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PromoCard({ promo, delay, priority }: { promo: PromoItem; delay: string; priority: boolean }) {
  const href = safeHref(promo.cta_href);
  const hasImage = Boolean(promo.image?.trim());

  return (
    <Link
      href={href}
      className={`tf-reveal ${delay} group relative flex min-w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-[calc(var(--radius)*1.4)] bg-[var(--color-secondary)] shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:min-w-0`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {hasImage ? (
          <Image
            src={promo.image as string}
            alt={promo.title ?? ""}
            fill
            priority={priority}
            sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {promo.badge?.trim() && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg">
            <Tag className="h-3.5 w-3.5" /> {promo.badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5">
          {promo.title && (
            <h3 className="text-xl font-bold leading-tight text-white drop-shadow-sm" style={{ fontFamily: "var(--font-heading)" }}>
              {promo.title}
            </h3>
          )}
          {promo.subtitle && <p className="mt-1.5 line-clamp-2 text-sm text-white/85">{promo.subtitle}</p>}
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
            {promo.cta_label?.trim() || "Ver oferta"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
