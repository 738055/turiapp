"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Servico } from "./ServicosSection";

export default function AmbientesSection({ ambientes }: { ambientes: Servico[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="ambientes" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={ref} className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[#C4623A] text-[11px] tracking-[0.35em] uppercase mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              A Estrutura
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[#1C3A2A] text-[clamp(2.5rem,5vw,4rem)] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Nossos
              <br />
              <em className="not-italic text-[#B8963E]">Ambientes</em>.
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link
              href="/ambientes"
              className="inline-flex items-center gap-2 text-[#1C3A2A] text-xs tracking-[0.2em] uppercase font-medium hover:text-[#C4623A] transition-colors group"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Ver galeria completa
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Grid Assimétrico (Estilo Portfólio de Arquitetura) */}
        {ambientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[300px] md:auto-rows-[400px]">
            {ambientes.slice(0, 4).map((item, i) => {
              const img = (item.imagens as string[])?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";
              // Alternando tamanhos: Item 0 = 8 colunas, Item 1 = 4 colunas, Item 2 = 4 colunas, Item 3 = 8 colunas
              const isLarge = i === 0 || i === 3;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                  className={`group relative overflow-hidden bg-[#FAF7F2] ${isLarge ? "md:col-span-8" : "md:col-span-4"}`}
                >
                  <Image
                    src={img}
                    alt={item.titulo}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                    sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                  />
                  {/* Overlay gradiente escuro em hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C3A2A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Conteúdo Textual em Hover */}
                  <div className="absolute bottom-0 left-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <h3
                      className="text-[#FAF7F2] text-2xl mb-2"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                    >
                      {item.titulo}
                    </h3>
                    {item.descricao && (
                      <p
                        className="text-[#FAF7F2]/70 text-sm line-clamp-2 max-w-md"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border border-[#1C3A2A]/10 bg-[#FAF7F2]/20">
            <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              Nenhum ambiente cadastrado no momento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}