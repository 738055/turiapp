"use client";

// Valores padrão em: src/config/defaults.ts  ← edite lá para mudar no código
// Para mudar sem deploy, use o painel: /admin/conteudo/cta
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import type { CtaConfig } from "@/lib/db/schema";
import { CTA, SITE } from "@/config/defaults";

interface Props {
  config?: CtaConfig | null;
}

export default function CTASection({ config }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const bgImage        = config?.bg_image_url         || CTA.bg;
  const label          = config?.label                 || CTA.label;
  const tituloLinha1   = config?.titulo_linha1         || CTA.tituloLinha1;
  const tituloDestaque = config?.titulo_destaque       || CTA.tituloDestaque;
  const tituloLinha2   = config?.titulo_linha2         || CTA.tituloLinha2;
  const subtitulo      = config?.subtitulo             || CTA.subtitulo;
  const btn1Texto      = config?.btn_primario_texto    || CTA.btn1Texto;
  const btn1Wa         = config?.btn_primario_whatsapp || SITE.whatsapp;
  const btn1Msg        = config?.btn_primario_mensagem || CTA.btn1Mensagem;
  const btn2Texto      = config?.btn_secundario_texto  || CTA.btn2Texto;
  const btn2Href       = config?.btn_secundario_href   || CTA.btn2Href;

  return (
    <section className="relative flex items-center justify-center min-h-[80vh] py-24 md:py-36 overflow-hidden grain-texture">
      <motion.div className="absolute inset-0 w-full h-full"
        initial={{ scale: 1 }}
        animate={inView ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 15, ease: "easeOut" }}
        style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-[#0A140F]/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A140F] via-[#0A140F]/30 to-transparent" />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-6"
          style={{ fontFamily: "var(--font-body)" }}>
          {label}
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[#FAF7F2] text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] mb-8"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          {tituloLinha1}
          <br />
          <em className="italic text-[#B8963E] font-light">{tituloDestaque}</em> {tituloLinha2}
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[#FAF7F2]/80 text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto"
          style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
          {subtitulo}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <a href={`https://wa.me/${btn1Wa}?text=${encodeURIComponent(btn1Msg)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-3 bg-[#C4623A] text-white px-8 py-4 md:px-10 md:py-5 text-sm tracking-widest uppercase font-medium transition-all duration-500 ease-out hover:bg-[#A9502D] hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(196,98,58,0.6)]"
            style={{ fontFamily: "var(--font-body)" }}>
            <MessageCircle className="w-5 h-5" />
            {btn1Texto}
          </a>
          <Link href={btn2Href}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-[#FAF7F2] border border-[#FAF7F2]/30 px-8 py-4 md:px-10 md:py-5 text-sm tracking-widest uppercase font-medium transition-all duration-500 ease-out hover:border-[#FAF7F2] hover:bg-[#FAF7F2]/10"
            style={{ fontFamily: "var(--font-body)" }}>
            {btn2Texto}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
