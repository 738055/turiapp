"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, BedDouble, Bath, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface Hospedagem {
  id: number;
  slug: string;
  titulo: string;
  descricao_curta?: string | null;
  capacidade_max?: number | null;
  quartos?: number | null;
  banheiros?: number | null;
  preco_base?: number | null;
  destaque?: boolean | null;
  imagens?: string[] | null;
}

interface Props {
  hospedagens: Hospedagem[];
}

function HospedagemCard({ item, index }: { item: Hospedagem; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const img = (item.imagens as string[])?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: "easeOut" }}
      className="group relative bg-white overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500"
    >
      {/* Image */}
      <div className="relative h-72 overflow-hidden">
        <Image
          src={img}
          alt={item.titulo}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C3A2A]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Destaque badge */}
        {item.destaque && (
          <span
            className="absolute top-4 left-4 bg-[#B8963E] text-white text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 z-10"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Destaque
          </span>
        )}

        {/* Price overlay on hover */}
        <div className="absolute bottom-4 left-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
          {item.preco_base && (
            <p className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 300 }}>
              {formatCurrency(item.preco_base)}
              <span className="text-white/70 text-sm ml-1" style={{ fontFamily: "var(--font-body)" }}>/ noite</span>
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p
          className="text-[#C4623A] text-[10px] tracking-[0.25em] uppercase mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Hospedagem
        </p>
        <h3
          className="text-[#1C3A2A] text-2xl mb-3 group-hover:text-[#C4623A] transition-colors"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          {item.titulo}
        </h3>
        {item.descricao_curta && (
          <p
            className="text-[#1C3A2A]/60 text-sm leading-relaxed mb-5 line-clamp-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {item.descricao_curta}
          </p>
        )}

        {/* Specs */}
        <div
          className="flex items-center gap-5 text-[#1C3A2A]/50 text-xs border-t border-[#1C3A2A]/10 pt-4 mb-5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {item.capacidade_max} pessoas
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5" /> {item.quartos} quartos
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5" /> {item.banheiros} banheiros
          </span>
        </div>

        <Link
          href={`/hospedagem/${item.slug}`}
          className="inline-flex items-center gap-2 text-[#1C3A2A] text-xs tracking-[0.2em] uppercase font-medium hover:text-[#C4623A] transition-colors group/link"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Ver detalhes
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function HospedagemSection({ hospedagens }: Props) {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="hospedagem" className="py-28 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <div ref={sectionRef} className="max-w-2xl mb-16">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[#C4623A] text-[11px] tracking-[0.35em] uppercase mb-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Nossas acomodações
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[#1C3A2A] text-[clamp(2.5rem,5vw,4rem)] leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          Hospedagem que
          <br />
          <em className="not-italic text-[#B8963E]">transforma</em> viagens.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[#1C3A2A]/60 text-base leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Cada acomodação foi pensada para proporcionar uma imersão completa na
          natureza sem abrir mão do conforto e da sofisticação.
        </motion.p>
      </div>

      {/* Grid */}
      {hospedagens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hospedagens.map((item, i) => (
            <HospedagemCard key={item.id} item={item} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-[#1C3A2A]/10 bg-white">
          <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
            Nenhuma hospedagem disponível no momento.
          </p>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-12 text-center"
      >
        <a
          href="https://wa.me/5545999999999?text=Olá, gostaria de saber mais sobre as hospedagens!"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-10 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:bg-[#2a5540] hover:-translate-y-0.5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Consultar disponibilidade
        </a>
      </motion.div>
    </section>
  );
}
