"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import type { Servico } from "./ServicosSection";

export default function ExperienciasSection({ experiencias }: { experiencias: Servico[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const defaultColors = ["#C4623A", "#1C3A2A", "#B8963E"];

  if (experiencias.length === 0) return null;

  return (
    <section id="experiencias" className="py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={ref} className="mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[#C4623A] text-[11px] tracking-[0.35em] uppercase mb-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Além da hospedagem
          </motion.p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[#1C3A2A] text-[clamp(2.5rem,5vw,4rem)] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Viva cada
              <br />
              <em className="not-italic text-[#B8963E]">momento</em>.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-[#1C3A2A]/50 text-sm tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Arraste para explorar →
            </motion.p>
          </div>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="snap-x-container flex gap-6 px-6 lg:px-12 pb-6">
        {experiencias.map((exp, i) => {
          const img = exp.imagens?.[0] || exp.imagem_url || "https://images.unsplash.com/photo-1548019979-e9d4b98d0e85?w=600&q=80";
          const color = defaultColors[i % defaultColors.length];
          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.1 }}
              className="flex-none w-[320px] lg:w-[380px] snap-start group"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Image */}
              <div className="relative h-80 overflow-hidden mb-6">
                <Image
                  src={img}
                  alt={exp.titulo}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  sizes="380px"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ backgroundColor: color }}
                />
                <span
                  className="absolute top-4 left-4 text-white text-[10px] tracking-[0.25em] uppercase px-3 py-1.5"
                  style={{
                    fontFamily: "var(--font-body)",
                    backgroundColor: color,
                  }}
                >
                  {exp.categoria}
                </span>
              </div>
              <h3
                className="text-[#1C3A2A] text-2xl mb-2 group-hover:text-[#C4623A] transition-colors"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
              >
                {exp.titulo}
              </h3>
              <p
                className="text-[#1C3A2A]/60 text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {exp.descricao}
              </p>
            </motion.div>
          );
        })}
        {/* End spacer */}
        <div className="flex-none w-6" />
      </div>
    </section>
  );
}
