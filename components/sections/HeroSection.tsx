import Image from "next/image";
import { BadgeCheck, Calendar, MapPin, Search, ShieldCheck, Star, Users } from "lucide-react";
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
  sm: "min-h-[46vh]",
  md: "min-h-[68vh]",
  lg: "min-h-[86vh]",
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
  const variant = cfg.variant ?? "classic";

  if (variant === "marketplace") return <MarketplaceHero cfg={cfg} />;
  if (variant === "editorial") return <EditorialHero cfg={cfg} />;
  return <ClassicHero cfg={cfg} />;
}

function MarketplaceHero({ cfg }: { cfg: HeroConfig }) {
  const imageUrl = cfg.image_url || "/storefront/receptivo/hero-cataratas.jpg";
  const title = cfg.title || "Conheca experiencias locais sem improviso";
  const subtitle = cfg.subtitle || "Passeios, transfers e pacotes com atendimento local, confirmacao clara e suporte do inicio ao fim.";
  const stats = cfg.stats?.length
    ? cfg.stats
    : [
        { value: "24h", label: "suporte ao viajante" },
        { value: "4.9", label: "avaliacao media" },
        { value: "10x", label: "pagamento facilitado" },
      ];

  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)]">
      <Image src={imageUrl} alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-secondary)]/85 to-[var(--color-secondary)]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-secondary)] via-transparent to-[var(--color-secondary)]/35" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-44">
        <div className="max-w-3xl">
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <BadgeCheck size={14} className="text-[var(--color-accent)]" />
              {cfg.eyebrow || "Agencia receptiva local"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <Star size={15} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
              4,9 <span className="font-medium text-white/50">+ viajantes atendidos</span>
            </span>
          </div>

          <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-[1.02] text-white md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
            {subtitle}
          </p>

          <form action="/busca" method="GET" className="flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
            <div className="flex flex-[1.4] items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
              <MapPin className="shrink-0 text-[var(--color-primary)]" size={20} />
              <div className="w-full text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Passeio ou destino</label>
                <input name="q" placeholder="Cataratas, transfer, city tour..." className="w-full bg-transparent font-semibold text-gray-900 outline-none placeholder:text-gray-400" />
              </div>
            </div>
            <div className="hidden w-px bg-gray-100 sm:my-2 sm:block" />
            <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
              <Calendar className="shrink-0 text-[var(--color-primary)]" size={20} />
              <div className="w-full text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Modulo</label>
                <select name="modulo" defaultValue="" className="w-full bg-transparent font-semibold text-gray-900 outline-none">
                  <option value="">Todos</option>
                  <option value="receptivo">Passeios</option>
                  <option value="emissivo">Pacotes</option>
                  <option value="hospedagem">Hospedagem</option>
                </select>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-7 py-4 font-bold text-white shadow-lg shadow-black/10 transition-all hover:brightness-95 active:scale-[0.98]">
              <Search size={20} />
              Buscar
            </button>
          </form>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-white/70">
            <span className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={18} /> Pagamento seguro</span>
            <span className="flex items-center gap-2 text-sm font-medium"><Users size={18} /> Atendimento local</span>
            <span className="flex items-center gap-2 text-sm font-medium"><BadgeCheck size={18} /> Confirmacao clara</span>
          </div>
        </div>

        <div className="mt-12 grid max-w-3xl grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          {stats.slice(0, 3).map((stat) => (
            <div key={`${stat.value}-${stat.label}`} className="px-5 py-5 first:pl-0">
              <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-white/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialHero({ cfg }: { cfg: HeroConfig }) {
  const imageUrl = cfg.image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";
  const stats = cfg.stats ?? [];

  return (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden bg-[#0f1e16]">
      <Image src={imageUrl} alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1e16]/45 via-transparent to-[#0f1e16]/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c3a2a]/70 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-0 lg:px-12">
        <div className="mb-16 max-w-3xl">
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">{cfg.eyebrow || "Experiencia selecionada"}</p>
          <h1 className="mb-8 text-[clamp(3rem,8vw,6rem)] font-light leading-[0.95] text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {cfg.title || "Hospedagem que transforma viagens"}
          </h1>
          <p className="max-w-lg text-lg font-light leading-relaxed text-white/70">
            {cfg.subtitle || "Conforto, natureza e reserva simples em uma vitrine elegante."}
          </p>
          {cfg.cta_label && cfg.cta_href && (
            <a href={cfg.cta_href} className="mt-10 inline-flex bg-[var(--color-accent)] px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:brightness-110">
              {cfg.cta_label}
            </a>
          )}
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 lg:grid-cols-3">
            {stats.slice(0, 3).map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="px-6 py-5 first:pl-0">
                <p className="text-3xl font-light text-white lg:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ClassicHero({ cfg }: { cfg: HeroConfig }) {
  const height = heightMap[cfg.height ?? "md"];
  const align = cfg.align ?? "center";
  const alignClass = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";

  return (
    <section className={`relative flex flex-col justify-center overflow-hidden px-6 py-16 ${height}`} style={{ backgroundColor: "var(--color-primary)" }}>
      {cfg.image_url && (
        <>
          <Image src={cfg.image_url} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: cfg.overlay_opacity ?? 0.45 }} />
        </>
      )}
      <div className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 ${alignClass}`}>
        {cfg.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">{cfg.eyebrow}</p>}
        {cfg.title && <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white drop-shadow md:text-6xl">{cfg.title}</h1>}
        {cfg.subtitle && <p className="max-w-2xl text-lg text-white/90 drop-shadow md:text-xl">{cfg.subtitle}</p>}
        {cfg.cta_label && cfg.cta_href && (
          <a href={cfg.cta_href} className="mt-2 inline-flex w-fit rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-3 font-semibold text-white transition hover:brightness-95">
            {cfg.cta_label}
          </a>
        )}
      </div>
    </section>
  );
}
