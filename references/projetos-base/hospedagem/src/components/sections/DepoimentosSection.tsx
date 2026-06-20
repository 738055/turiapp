"use client";

// Valores padrão em: src/config/defaults.ts  ← edite lá para mudar no código
// Para mudar sem deploy, use o painel: /admin/conteudo/depoimentos
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { Depoimento } from "@/lib/db/schema";
import { DEPOIMENTOS } from "@/config/defaults";

interface Props {
  depoimentos?: Depoimento[] | null;
}

export default function DepoimentosSection({ depoimentos }: Props) {
  const items = (depoimentos && depoimentos.length > 0) ? depoimentos : DEPOIMENTOS as Depoimento[];
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 5000);
    return () => clearInterval(t);
  }, [auto, items.length]);

  const prev = () => { setAuto(false); setCurrent((c) => (c - 1 + items.length) % items.length); };
  const next = () => { setAuto(false); setCurrent((c) => (c + 1) % items.length); };

  const dep = items[current];
  if (!dep) return null;

  return (
    <section className="py-28 relative overflow-hidden" style={{ backgroundColor: "#F0EBE2" }}>
      <div className="absolute top-8 left-8 lg:left-20 text-[20rem] leading-none text-[#1C3A2A]/5 select-none pointer-events-none"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }} aria-hidden>
        &ldquo;
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
        <p className="text-[#C4623A] text-[11px] tracking-[0.35em] uppercase mb-12" style={{ fontFamily: "var(--font-body)" }}>
          O que dizem nossos hóspedes
        </p>

        <div className="flex items-center justify-center gap-1 mb-8">
          {[...Array(dep.nota ?? 5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-[#B8963E] text-[#B8963E]" />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={dep.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}>
            <blockquote className="text-[#1C3A2A] text-[clamp(1.25rem,3vw,2rem)] leading-relaxed mb-8"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              &ldquo;{dep.texto}&rdquo;
            </blockquote>
            <p className="text-[#1C3A2A] font-medium text-sm mb-1" style={{ fontFamily: "var(--font-body)" }}>{dep.nome}</p>
            <p className="text-[#1C3A2A]/50 text-xs tracking-wide" style={{ fontFamily: "var(--font-body)" }}>
              {dep.origem}{dep.estadia ? ` · ${dep.estadia}` : ""}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-6 mt-12">
          <button onClick={prev}
            className="w-10 h-10 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#1C3A2A] transition-colors"
            aria-label="Anterior">
            <ChevronLeft className="w-4 h-4 text-[#1C3A2A]" />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => { setAuto(false); setCurrent(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-[#C4623A] w-6" : "bg-[#1C3A2A]/20"}`}
                aria-label={`Depoimento ${i + 1}`} />
            ))}
          </div>
          <button onClick={next}
            className="w-10 h-10 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#1C3A2A] transition-colors"
            aria-label="Próximo">
            <ChevronRight className="w-4 h-4 text-[#1C3A2A]" />
          </button>
        </div>
      </div>
    </section>
  );
}
