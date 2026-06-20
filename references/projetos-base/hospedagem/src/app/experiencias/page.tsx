import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CTASection from "@/components/sections/CTASection";
import { supabase } from "@/lib/supabase";
import type { Servico, ConfigSite, CtaConfig } from "@/lib/db/schema";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Experiências",
  description: "Experiências exclusivas da Mimosa Flor em Foz do Iguaçu, da gastronomia ao contato com a natureza.",
};

export default async function ExperienciasPage() {
  const [expRes, cfgRes, ctaRes] = await Promise.all([
    supabase.from("servicos").select("*").eq("categoria", "experiencia").eq("disponivel", true),
    supabase.from("config_site").select("*").eq("id", 1).single(),
    supabase.from("cta_config").select("*").eq("id", 1).single(),
  ]);

  const experiencias = (expRes.data as Servico[]) || [];
  const cfg = (cfgRes.data as ConfigSite | null) ?? null;
  const ctaConfig = (ctaRes.data as CtaConfig | null) ?? null;
  const whatsapp = cfg?.whatsapp || "5545999999999";
  const nomeSite = cfg?.nome_site || "Mimosa Flor";
  const tagline  = cfg?.tagline  || "Casa de Campo";
  const mensagemReserva = cfg?.whatsapp_mensagem_reserva || "Olá, gostaria de fazer uma reserva na Mimosa Flor!";

  return (
    <>
      <Header nomeSite={nomeSite} tagline={tagline} whatsapp={whatsapp} whatsappMensagem={mensagemReserva} />
      <main className="min-h-screen bg-[#FAF7F2] pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          {/* Cabeçalho da Página */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>
              Viva o Inesquecível
            </p>
            <h1 className="text-[#1C3A2A] text-[clamp(2.5rem,5vw,4rem)] leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Experiências <em className="italic text-[#B8963E] font-light">Exclusivas</em>
            </h1>
            <p className="text-[#1C3A2A]/70 text-lg leading-relaxed">
              Cada detalhe pensado para transformar sua estadia em uma memória perfeita. Da gastronomia ao contato com a natureza.
            </p>
          </div>

          {/* Grid de Experiências */}
          {experiencias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {experiencias.map((exp) => {
                const img = exp.imagens?.[0] || exp.imagem_url || "https://images.unsplash.com/photo-1548019979-e9d4b98d0e85?w=800&q=80";

                return (
                  <div key={exp.id} className="group">
                    <div className="relative aspect-square overflow-hidden mb-6">
                      <Image
                        src={img}
                        alt={exp.titulo}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <h3 className="text-xl text-[#1C3A2A] mb-2" style={{ fontFamily: "var(--font-display)" }}>{exp.titulo}</h3>
                    <p className="text-[#1C3A2A]/70 leading-relaxed font-light text-sm">{exp.descricao}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 border border-[#1C3A2A]/10 bg-white">
              <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                Nenhuma experiência disponível no momento.
              </p>
            </div>
          )}

        </div>
      </main>
      <CTASection config={ctaConfig} />
      <Footer />
    </>
  );
}
