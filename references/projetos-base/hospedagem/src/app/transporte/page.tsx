import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import { Car, Users, Clock, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { TransporteOpcao, ConfigSite } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Transporte & Transfer",
  description: "Serviços de transfer e transporte para as Cataratas do Iguaçu e demais atrações de Foz do Iguaçu.",
};

export const revalidate = 0;

async function getData() {
  try {
    const [t, cfg] = await Promise.all([
      supabase.from("transporte_opcoes").select("*").eq("disponivel", true),
      supabase.from("config_site").select("*").eq("id", 1).single(),
    ]);
    return { items: (t.data as TransporteOpcao[]) || [], cfg: (cfg.data as ConfigSite | null) ?? null };
  } catch {
    return { items: [] as TransporteOpcao[], cfg: null };
  }
}

export default async function TransportePage() {
  const { items, cfg } = await getData();
  const whatsapp = cfg?.whatsapp || "5545999999999";
  const nomeSite = cfg?.nome_site || "Mimosa Flor";
  const tagline  = cfg?.tagline  || "Casa de Campo";
  const mensagemReserva = cfg?.whatsapp_mensagem_reserva || "Olá, gostaria de fazer uma reserva na Mimosa Flor!";

  const tipoLabel: Record<string, string> = {
    transfer: "Transfer", carro: "Carro", van: "Van", passeio: "Passeio",
  };

  return (
    <>
      <Header nomeSite={nomeSite} tagline={tagline} whatsapp={whatsapp} whatsappMensagem={mensagemReserva} />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-[#1C3A2A] py-24 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <p className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-4"
              style={{ fontFamily: "var(--font-body)" }}>
              Logística completa
            </p>
            <h1 className="text-[#FAF7F2] text-[clamp(2.5rem,6vw,5rem)] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              Transporte &
              <br />
              <em className="not-italic text-[#B8963E]">Transfer</em>.
            </h1>
          </div>
        </section>

        {/* Cards */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {items.map((item) => (
                <div key={item.id} className="border border-[#1C3A2A]/10 p-8 hover:border-[#1C3A2A]/30 transition-colors group">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-[#C4623A] mb-3 border border-[#C4623A]/30 px-2 py-1"
                        style={{ fontFamily: "var(--font-body)" }}>
                        {tipoLabel[item.tipo || "transfer"]}
                      </span>
                      <h2 className="text-[#1C3A2A] text-2xl group-hover:text-[#C4623A] transition-colors"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                        {item.titulo}
                      </h2>
                    </div>
                    {item.preco && (
                      <p className="text-[#1C3A2A] text-xl text-right shrink-0 ml-4"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                        {formatCurrency(item.preco)}
                      </p>
                    )}
                  </div>

                  <p className="text-[#1C3A2A]/60 text-sm leading-relaxed mb-6"
                    style={{ fontFamily: "var(--font-body)" }}>
                    {item.descricao}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-[#1C3A2A]/40 mb-8"
                    style={{ fontFamily: "var(--font-body)" }}>
                    {item.capacidade && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Até {item.capacidade} pessoas
                      </span>
                    )}
                    {item.duracao_estimada && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {item.duracao_estimada}
                      </span>
                    )}
                    {item.origem && item.destino && (
                      <span className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" /> {item.origem} → {item.destino}
                      </span>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de contratar o serviço: ${item.titulo}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#2a5540] transition-colors"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Solicitar via WhatsApp
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-[#1C3A2A]/10 bg-white">
              <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                Nenhuma opção de transporte disponível no momento.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
