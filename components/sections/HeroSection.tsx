import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Calendar, MapPin, Search, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface HeroConfig {
  variant?: "classic" | "marketplace" | "editorial" | "split" | "gradient" | "spotlight";
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
  if (variant === "split") return <SplitHero cfg={cfg} />;
  if (variant === "gradient") return <GradientHero cfg={cfg} />;
  if (variant === "spotlight") return <SpotlightHero cfg={cfg} />;
  return <ClassicHero cfg={cfg} />;
}

function MarketplaceHero({ cfg }: { cfg: HeroConfig }) {
  const imageUrl = cfg.image_url || "/storefront/receptivo/hero-cataratas.jpg";
  const title = cfg.title || "Conheca experiencias locais sem improviso";
  const subtitle = cfg.subtitle || "Passeios, transfers e pacotes com atendimento local, confirmacao clara e suporte do inicio ao fim.";
  const configuredStats = (cfg.stats ?? []).filter((stat) => stat.value?.trim() || stat.label?.trim());
  const stats = configuredStats.length
    ? configuredStats
    : [
        { value: "24h", label: "suporte ao viajante" },
        { value: "4.9", label: "avaliacao media" },
        { value: "10x", label: "pagamento facilitado" },
      ];

  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)]">
      <Image src={imageUrl} alt="" fill priority className="object-cover tf-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-secondary)]/85 to-[var(--color-secondary)]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-secondary)] via-transparent to-[var(--color-secondary)]/35" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-44">
        <div className="max-w-3xl">
          <div className="tf-reveal mb-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <BadgeCheck size={14} className="text-[var(--color-accent)]" />
              {cfg.eyebrow || "Agencia receptiva local"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <Star size={15} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
              4,9 <span className="font-medium text-white/50">+ viajantes atendidos</span>
            </span>
          </div>

          <h1 className="tf-reveal tf-delay-1 mb-6 max-w-3xl text-4xl font-extrabold leading-[1.02] text-white md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="tf-reveal tf-delay-2 mb-10 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
            {subtitle}
          </p>

          <form action="/busca" method="GET" className="tf-reveal tf-delay-3 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
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

          <div className="tf-reveal tf-delay-4 mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-white/70">
            <span className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={18} /> Pagamento seguro</span>
            <span className="flex items-center gap-2 text-sm font-medium"><Users size={18} /> Atendimento local</span>
            <span className="flex items-center gap-2 text-sm font-medium"><BadgeCheck size={18} /> Confirmacao clara</span>
          </div>
        </div>

        <div className="tf-reveal tf-delay-5 mt-12 grid max-w-3xl grid-cols-3 divide-x divide-white/10 border-t border-white/10">
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
  const stats = (cfg.stats ?? []).filter((stat) => stat.value?.trim() || stat.label?.trim());

  return (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden bg-[#0f1e16]">
      <Image src={imageUrl} alt="" fill priority className="object-cover tf-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1e16]/45 via-transparent to-[#0f1e16]/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c3a2a]/70 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-0 lg:px-12">
        <div className="mb-16 max-w-3xl">
          <p className="tf-reveal mb-6 text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">{cfg.eyebrow || "Experiencia selecionada"}</p>
          <h1 className="tf-reveal tf-delay-1 mb-8 text-[clamp(3rem,8vw,6rem)] font-light leading-[0.95] text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {cfg.title || "Hospedagem que transforma viagens"}
          </h1>
          <p className="tf-reveal tf-delay-2 max-w-lg text-lg font-light leading-relaxed text-white/70">
            {cfg.subtitle || "Conforto, natureza e reserva simples em uma vitrine elegante."}
          </p>
          {cfg.cta_label && cfg.cta_href && (
            <a href={cfg.cta_href} className="tf-reveal tf-delay-3 mt-10 inline-flex bg-[var(--color-accent)] px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:brightness-110">
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
          <Image src={cfg.image_url} alt="" fill priority className="object-cover tf-kenburns" />
          <div className="absolute inset-0 bg-black" style={{ opacity: cfg.overlay_opacity ?? 0.45 }} />
        </>
      )}
      <div className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 ${alignClass}`}>
        {cfg.eyebrow && <p className="tf-reveal text-xs font-semibold uppercase tracking-[0.28em] text-white/75">{cfg.eyebrow}</p>}
        {cfg.title && <h1 className="tf-reveal tf-delay-1 max-w-4xl text-4xl font-bold leading-tight text-white drop-shadow md:text-6xl">{cfg.title}</h1>}
        {cfg.subtitle && <p className="tf-reveal tf-delay-2 max-w-2xl text-lg text-white/90 drop-shadow md:text-xl">{cfg.subtitle}</p>}
        {cfg.cta_label && cfg.cta_href && (
          <a href={cfg.cta_href} className="tf-reveal tf-delay-3 mt-2 inline-flex w-fit rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-3 font-semibold text-white transition hover:brightness-95">
            {cfg.cta_label}
          </a>
        )}
      </div>
    </section>
  );
}

// ─── New variants ────────────────────────────────────────────────────────────

/** Two-column hero: copy + search on the left, a framed image with floating
    stat chips on the right. Light, modern, great for receptivo/marketplace. */
function SplitHero({ cfg }: { cfg: HeroConfig }) {
  const imageUrl = cfg.image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";
  const stats = (cfg.stats ?? []).filter((s) => s.value?.trim() || s.label?.trim()).slice(0, 2);

  return (
    <section className="relative overflow-hidden bg-[var(--color-background)]">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-10 blur-3xl tf-glow" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div>
          {cfg.eyebrow && (
            <span className="tf-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              <Sparkles size={14} /> {cfg.eyebrow}
            </span>
          )}
          <h1 className="tf-reveal tf-delay-1 text-4xl font-extrabold leading-[1.05] text-[var(--color-text)] md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
            {cfg.title || "Experiencias que vendem sozinhas"}
          </h1>
          <p className="tf-reveal tf-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-text)]/70">
            {cfg.subtitle || "Uma vitrine moderna para apresentar seus produtos com clareza, confianca e reserva simples."}
          </p>
          <div className="tf-reveal tf-delay-3 mt-9 flex flex-wrap items-center gap-3">
            {cfg.cta_label && cfg.cta_href && (
              <a href={cfg.cta_href} className="group inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-7 py-3.5 font-bold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:-translate-y-0.5 hover:brightness-110">
                {cfg.cta_label}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
            )}
            <Link href="/busca" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-text)]/15 px-6 py-3.5 font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)]/5">
              <Search size={18} /> Buscar
            </Link>
          </div>
        </div>

        <div className="tf-reveal-zoom tf-delay-2 relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius)*2)] shadow-2xl shadow-black/20">
            <Image src={imageUrl} alt="" fill className="object-cover tf-kenburns" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          {stats[0] && (
            <div className="tf-float absolute -left-4 top-10 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5">
              <p className="text-2xl font-extrabold text-[var(--color-primary)]">{stats[0].value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{stats[0].label}</p>
            </div>
          )}
          {stats[1] && (
            <div className="tf-float-slow absolute -right-4 bottom-12 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5">
              <p className="text-2xl font-extrabold text-[var(--color-accent)]">{stats[1].value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{stats[1].label}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Imageless animated-gradient hero: bold centered type over a moving mesh of
    brand colors. Vibrant — events, ingressos, urban/nightlife, festivals. */
function GradientHero({ cfg }: { cfg: HeroConfig }) {
  const stats = (cfg.stats ?? []).filter((s) => s.value?.trim() || s.label?.trim()).slice(0, 3);

  return (
    <section
      className="tf-gradient-anim relative overflow-hidden"
      style={{ backgroundImage: "linear-gradient(120deg, var(--color-secondary), var(--color-primary) 45%, var(--color-accent))" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center lg:py-36">
        {cfg.eyebrow && (
          <span className="tf-reveal mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            <Sparkles size={14} /> {cfg.eyebrow}
          </span>
        )}
        <h1 className="tf-reveal tf-delay-1 text-5xl font-extrabold leading-[1.03] text-white drop-shadow-sm md:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
          {cfg.title || "Sua proxima experiencia comeca aqui"}
        </h1>
        <p className="tf-reveal tf-delay-2 mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
          {cfg.subtitle || "Descubra, reserve e viva momentos inesqueciveis com poucos cliques."}
        </p>
        {cfg.cta_label && cfg.cta_href && (
          <a href={cfg.cta_href} className="tf-reveal tf-delay-3 group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[var(--color-secondary)] shadow-2xl shadow-black/20 transition-all hover:-translate-y-0.5">
            {cfg.cta_label}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </a>
        )}
        {stats.length > 0 && (
          <div className="tf-reveal tf-delay-4 mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="text-center">
                <p className="text-3xl font-extrabold text-white md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Minimal, airy spotlight: lots of whitespace, an arched framed image and
    refined serif type. Luxury / premium / boutique stays. */
function SpotlightHero({ cfg }: { cfg: HeroConfig }) {
  const imageUrl = cfg.image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

  return (
    <section className="relative overflow-hidden bg-[var(--color-background)]">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center lg:py-28">
        {cfg.eyebrow && (
          <p className="tf-reveal mb-7 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-accent)]">{cfg.eyebrow}</p>
        )}
        <h1 className="tf-reveal tf-delay-1 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] text-[var(--color-text)]" style={{ fontFamily: "var(--font-heading)" }}>
          {cfg.title || "O cuidado de uma curadoria sob medida"}
        </h1>
        <p className="tf-reveal tf-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text)]/65">
          {cfg.subtitle || "Cada detalhe pensado para uma experiencia memoravel, do primeiro contato a viagem."}
        </p>
        {cfg.cta_label && cfg.cta_href && (
          <a href={cfg.cta_href} className="tf-reveal tf-delay-3 mt-9 inline-flex items-center gap-2 border-b-2 border-[var(--color-accent)] pb-1 text-sm font-semibold uppercase tracking-widest text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]">
            {cfg.cta_label} <ArrowRight size={16} />
          </a>
        )}
        <div className="tf-reveal-zoom tf-delay-2 relative mt-16 w-full max-w-2xl">
          <div className="relative aspect-[16/10] overflow-hidden rounded-t-[14rem] shadow-2xl shadow-black/15">
            <Image src={imageUrl} alt="" fill priority className="object-cover tf-kenburns" />
          </div>
        </div>
      </div>
    </section>
  );
}
