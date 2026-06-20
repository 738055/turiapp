import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CTASection from "@/components/sections/CTASection";
import { supabase } from "@/lib/supabase";
import type { Servico, ConfigSite, CtaConfig } from "@/lib/db/schema";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ambientes",
  description: "Conheça os espaços, piscinas, varandas e toda a estrutura da Casa de Campo Mimosa Flor.",
};

export default async function AmbientesPage() {
  const [ambRes, cfgRes, ctaRes] = await Promise.all([
    supabase.from("servicos").select("*").eq("categoria", "ambiente").eq("disponivel", true),
    supabase.from("config_site").select("*").eq("id", 1).single(),
    supabase.from("cta_config").select("*").eq("id", 1).single(),
  ]);

  const ambientes  = (ambRes.data  as Servico[])         || [];
  const cfg        = (cfgRes.data  as ConfigSite | null)  ?? null;
  const ctaConfig  = (ctaRes.data  as CtaConfig | null)   ?? null;
  const whatsapp         = cfg?.whatsapp || "5545999999999";
  const nomeSite         = cfg?.nome_site || "Mimosa Flor";
  const tagline          = cfg?.tagline  || "Casa de Campo";
  const mensagemReserva  = cfg?.whatsapp_mensagem_reserva || "Olá, gostaria de fazer uma reserva na Mimosa Flor!";

  return (
    <>
      <Header nomeSite={nomeSite} tagline={tagline} whatsapp={whatsapp} whatsappMensagem={mensagemReserva} />
      <main className="min-h-screen bg-[#FAF7F2] pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>
              Espaços de convivência
            </p>
            <h1 className="text-[#1C3A2A] text-[clamp(2.5rem,5vw,4rem)] leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Nossos <em className="italic text-[#B8963E] font-light">Ambientes</em>
            </h1>
            <p className="text-[#1C3A2A]/70 text-lg leading-relaxed">
              Descubra os espaços projetados para proporcionar conforto, relaxamento e memórias inesquecíveis durante sua estadia.
            </p>
          </div>

          {ambientes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              {ambientes.map((ambiente) => {
                const img = ambiente.imagens?.[0] || ambiente.imagem_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

                return (
                  <article key={ambiente.id} className="group">
                    <div className="relative aspect-[4/3] overflow-hidden mb-6">
                      <Image
                        src={img}
                        alt={ambiente.titulo}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <h2 className="text-2xl text-[#1C3A2A] mb-3" style={{ fontFamily: "var(--font-display)" }}>{ambiente.titulo}</h2>
                    <p className="text-[#1C3A2A]/70 leading-relaxed font-light">{ambiente.descricao}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 border border-[#1C3A2A]/10 bg-white">
              <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                Nenhum ambiente cadastrado no momento.
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
