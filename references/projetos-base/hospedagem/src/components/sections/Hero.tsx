"use client";

// Valores padrão em: src/config/defaults.ts  ← edite lá para mudar no código
// Para mudar sem deploy, use o painel: /admin/conteudo/hero
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import type { HeroConfig } from "@/lib/db/schema";
import { HERO, SITE } from "@/config/defaults";

interface HeroProps {
  config?: HeroConfig | null;
}

export default function Hero({ config }: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const bgImage        = config?.bg_image_url         || HERO.bg;
  const label          = config?.label_localizacao     || HERO.label;
  const tituloLinha1   = config?.titulo_linha1         || HERO.tituloLinha1;
  const tituloDestaque = config?.titulo_destaque       || HERO.tituloDestaque;
  const tituloLinha2   = config?.titulo_linha2         || HERO.tituloLinha2;
  const subtitulo      = config?.subtitulo             || HERO.subtitulo;
  const ctaTexto       = config?.cta_reserva_texto     || HERO.ctaTexto;
  const ctaWa          = config?.cta_reserva_whatsapp  || SITE.whatsapp;
  const ctaMensagem    = config?.cta_reserva_mensagem  || SITE.descricao;
  const cta2Texto      = config?.cta_secundario_texto  || HERO.cta2Texto;
  const cta2Href       = config?.cta_secundario_href   || HERO.cta2Href;

  const stats = HERO.stats.map((s, i) => ({
    value: [config?.stat_1_valor, config?.stat_2_valor, config?.stat_3_valor, config?.stat_4_valor][i] || s.valor,
    label: [config?.stat_1_label, config?.stat_2_label, config?.stat_3_label, config?.stat_4_label][i] || s.label,
  }));

  return (
    <section ref={containerRef} className="relative h-screen min-h-[700px] overflow-hidden flex items-end">
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0 will-change-transform" style={{ y, scale }}>
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1e16]/40 via-transparent to-[#0f1e16]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C3A2A]/60 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pb-0">
        <div className="mb-16 max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[#B8963E] text-xs tracking-[0.35em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>
            {label}
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35 }}
            className="text-white text-[clamp(3rem,8vw,6rem)] leading-[0.95] mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            {tituloLinha1}
            <br />
            <em className="text-[#B8963E] not-italic">{tituloDestaque}</em> {tituloLinha2}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}
            className="text-white/70 text-lg leading-relaxed max-w-lg"
            style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
            {subtitulo}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-wrap items-center gap-4 mt-10">
            <a href={`https://wa.me/${ctaWa}?text=${encodeURIComponent(ctaMensagem)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-8 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:bg-[#d4754e] hover:-translate-y-0.5"
              style={{ fontFamily: "var(--font-body)" }}>
              {ctaTexto}
            </a>
            <Link href={cta2Href}
              className="inline-flex items-center gap-2 text-white/80 text-sm tracking-widest uppercase font-medium border border-white/30 px-8 py-4 hover:border-white/60 transition-colors"
              style={{ fontFamily: "var(--font-body)" }}>
              {cta2Texto}
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }}
          className="border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-5 first:pl-0 group">
              <p className="text-white text-3xl lg:text-4xl mb-1 group-hover:text-[#B8963E] transition-colors"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                {stat.value}
              </p>
              <p className="text-white/50 text-xs tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-32 right-8 lg:right-12 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[10px] tracking-[0.3em] uppercase -rotate-90 origin-center" style={{ fontFamily: "var(--font-body)" }}>Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
