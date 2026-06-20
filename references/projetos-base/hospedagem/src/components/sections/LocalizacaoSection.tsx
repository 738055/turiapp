"use client";

// Valores padrão em: src/config/defaults.ts  ← edite lá para mudar no código
// Para mudar sem deploy, use o painel: /admin/conteudo/localizacao
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Clock, Car, Plane } from "lucide-react";
import type { LocalizacaoDistancia, ConfigSite } from "@/lib/db/schema";
import { DISTANCIAS, SITE } from "@/config/defaults";

function getIcon(tipo: string | null | undefined) {
  if (tipo === "plane") return Plane;
  if (tipo === "car")   return Car;
  return MapPin;
}

interface Props {
  distancias?: LocalizacaoDistancia[] | null;
  config?: ConfigSite | null;
}

export default function LocalizacaoSection({ distancias, config }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const items = (distancias && distancias.length > 0) ? distancias : DISTANCIAS as LocalizacaoDistancia[];
  const lat = config?.latitude  ?? SITE.latitude;
  const lng = config?.longitude ?? SITE.longitude;
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const mapEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.025},${lat - 0.02},${lng + 0.025},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <section className="py-28 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Info */}
          <div ref={ref}>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[#C4623A] text-[11px] tracking-[0.35em] uppercase mb-4"
              style={{ fontFamily: "var(--font-body)" }}>
              Como nos encontrar
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[#1C3A2A] text-[clamp(2rem,4vw,3.5rem)] leading-tight mb-8"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              No coração
              <br />
              de <em className="not-italic text-[#B8963E]">Foz do Iguaçu</em>.
            </motion.h2>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-4 mb-10">
              {items.map((item, i) => {
                const Icon = getIcon(item.tipo_icone);
                return (
                  <div key={item.id ?? i} className="flex items-center justify-between border-b border-[#1C3A2A]/10 pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-[#1C3A2A]/50" strokeWidth={1.5} />
                      </div>
                      <span className="text-[#1C3A2A] text-sm" style={{ fontFamily: "var(--font-body)" }}>{item.label}</span>
                    </div>
                    <div className="text-right" style={{ fontFamily: "var(--font-body)" }}>
                      <p className="text-[#1C3A2A] text-sm font-medium">{item.distancia}</p>
                      {item.tempo_estimado && (
                        <p className="text-[#1C3A2A]/40 text-xs flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> {item.tempo_estimado}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.a initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              href={mapLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-8 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:bg-[#2a5540] hover:-translate-y-0.5"
              style={{ fontFamily: "var(--font-body)" }}>
              <MapPin className="w-4 h-4" />
              Ver no mapa
            </motion.a>
          </div>

          {/* Right — Map embed */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[500px] overflow-hidden">
            <iframe src={mapEmbed}
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
              loading="lazy" title="Localização Mimosa Flor" />
            <div className="absolute top-4 left-4 bg-[#1C3A2A] text-[#FAF7F2] px-4 py-2 text-xs tracking-wider uppercase"
              style={{ fontFamily: "var(--font-body)" }}>
              {config?.nome_site || "Mimosa Flor"}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
