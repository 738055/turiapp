"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Waves, Utensils, Car, Compass } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface Servico {
  id: number;
  slug: string;
  titulo: string;
  descricao?: string | null;
  preco?: number | null;
  unidade?: string | null;
  categoria?: string | null;
  disponivel?: boolean | null;
  imagem_url?: string | null;
  imagens?: string[] | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  lazer: Waves,
  alimentacao: Utensils,
  transporte: Car,
  experiencia: Compass,
};

export default function ServicosSection({ servicos }: { servicos: Servico[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="servicos"
      className="py-28 relative overflow-hidden grain-texture"
      style={{ backgroundColor: "#1C3A2A" }}
    >
      {/* Decorative circle */}
      <div className="absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full border border-[#FAF7F2]/5" />
      <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] rounded-full border border-[#FAF7F2]/5" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
        {/* Header */}
        <div ref={ref} className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              O que oferecemos
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[#FAF7F2] text-[clamp(2.5rem,5vw,4rem)] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Experiências
              <br />
              <em className="not-italic text-[#B8963E]">sob medida</em>.
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[#FAF7F2]/50 text-base leading-relaxed max-w-sm lg:text-right"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Cada detalhe pensado para transformar sua estadia em uma memória inesquecível.
          </motion.p>
        </div>

        {/* Services grid */}
        {servicos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#FAF7F2]/10">
            {servicos.slice(0, 6).map((servico, i) => {
              const Icon = categoryIcons[servico.categoria || "lazer"] || Compass;
              return (
                <motion.div
                  key={servico.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                  className="bg-[#1C3A2A] p-8 group hover:bg-[#2a5540] transition-colors duration-300 relative"
                >
                  <div className="w-10 h-10 border border-[#B8963E]/40 flex items-center justify-center mb-6 group-hover:border-[#B8963E] group-hover:bg-[#B8963E]/10 transition-all">
                    <Icon className="w-4.5 h-4.5 text-[#B8963E]" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="text-[#FAF7F2] text-xl mb-3 group-hover:text-[#B8963E] transition-colors"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                  >
                    {servico.titulo}
                  </h3>
                  <p
                    className="text-[#FAF7F2]/50 text-sm leading-relaxed mb-6"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {servico.descricao}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[#B8963E] text-sm"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {servico.preco === 0 || !servico.preco
                        ? "Incluso"
                        : `${formatCurrency(servico.preco)} / ${servico.unidade}`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-[#FAF7F2]/10 bg-[#FAF7F2]/5">
            <p className="text-[#FAF7F2]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              Nenhum serviço cadastrado no momento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
