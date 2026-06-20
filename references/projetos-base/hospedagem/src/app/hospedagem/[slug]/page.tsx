import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils";
import { Users, BedDouble, Bath, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Hospedagem } from "@/lib/db/schema";

type Props = { params: Promise<{ slug: string }> };

async function getHospedagem(slug: string) {
  const { data, error } = await supabase
    .from("hospedagens")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Hospedagem | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getHospedagem(slug);

  if (!item) return { title: "Hospedagem não encontrada" };

  return {
    title: item.seo_titulo || item.titulo,
    description: item.seo_descricao || item.descricao_curta || undefined,
    openGraph: {
      images: item.seo_og_image ? [item.seo_og_image] : item.imagens || [],
    },
  };
}

export default async function HospedagemPage({ params }: Props) {
  const { slug } = await params;
  const item = await getHospedagem(slug);

  if (!item) notFound();

  const imgs = item.imagens || [];
  const amenidades = item.amenidades || [];
  const regras = item.regras || [];
  const mainImg = imgs[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80";

  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="relative h-[70vh] overflow-hidden">
          <Image src={mainImg} alt={item.titulo} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C3A2A]/50 to-[#0f1e16]/70" />
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 lg:px-12 pb-16">
            <p className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-3" style={{ fontFamily: "var(--font-body)" }}>
              Hospedagem
            </p>
            <h1 className="text-white text-[clamp(2.5rem,6vw,5rem)] leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              {item.titulo}
            </h1>
            {item.preco_base && (
              <p className="text-[#FAF7F2]/80 text-xl mt-2" style={{ fontFamily: "var(--font-display)" }}>
                A partir de {formatCurrency(item.preco_base)}{" "}
                <span className="text-sm text-[#FAF7F2]/50" style={{ fontFamily: "var(--font-body)" }}>/ noite</span>
              </p>
            )}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-8 mb-12 pb-12 border-b border-[#1C3A2A]/10">
                {[
                  { icon: Users, label: `${item.capacidade_max || "-"} pessoas` },
                  { icon: BedDouble, label: `${item.quartos || "-"} quartos` },
                  { icon: Bath, label: `${item.banheiros || "-"} banheiros` },
                  { icon: Clock, label: `Check-in ${item.check_in || "14:00"}` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-[#1C3A2A]/60" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
                    <Icon className="w-4 h-4 text-[#C4623A]" strokeWidth={1.5} />
                    {label}
                  </div>
                ))}
              </div>

              {item.descricao_longa && (
                <div className="mb-12">
                  <h2 className="text-[#1C3A2A] text-2xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                    Sobre a hospedagem
                  </h2>
                  <div className="text-[#1C3A2A]/70 leading-relaxed whitespace-pre-line" style={{ fontFamily: "var(--font-body)" }}>
                    {item.descricao_longa}
                  </div>
                </div>
              )}

              {amenidades.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-[#1C3A2A] text-2xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                    Comodidades
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {amenidades.map((amenidade) => (
                      <div key={amenidade.label} className="flex items-center gap-2 text-sm text-[#1C3A2A]/70" style={{ fontFamily: "var(--font-body)" }}>
                        <CheckCircle className="w-4 h-4 text-[#B8963E]" />
                        {amenidade.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {regras.length > 0 && (
                <div>
                  <h2 className="text-[#1C3A2A] text-2xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                    Regras da casa
                  </h2>
                  <ul className="space-y-2">
                    {regras.map((regra) => (
                      <li key={regra} className="text-sm text-[#1C3A2A]/60 flex items-start gap-2" style={{ fontFamily: "var(--font-body)" }}>
                        <span className="text-[#C4623A] mt-0.5">-</span> {regra}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside>
              <div className="sticky top-28 bg-[#1C3A2A] text-[#FAF7F2] p-8">
                <p className="text-[#B8963E] text-[11px] tracking-[0.25em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>
                  Fazer reserva
                </p>
                {item.preco_base && (
                  <p className="text-4xl mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                    {formatCurrency(item.preco_base)}
                  </p>
                )}
                <p className="text-[#FAF7F2]/50 text-xs mb-8" style={{ fontFamily: "var(--font-body)" }}>
                  por noite · consulte disponibilidade
                </p>
                <a
                  href={`https://wa.me/5545999999999?text=${encodeURIComponent(`Olá! Tenho interesse em reservar a ${item.titulo}. Podem me informar a disponibilidade?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#C4623A] text-white py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors mb-3"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <MessageCircle className="w-4 h-4" /> Reservar via WhatsApp
                </a>
                <a
                  href="/contato"
                  className="flex items-center justify-center w-full border border-[#FAF7F2]/20 text-[#FAF7F2]/70 py-4 text-sm tracking-widest uppercase font-medium hover:border-[#FAF7F2]/40 transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Formulário de contato
                </a>

                <div className="border-t border-[#FAF7F2]/10 mt-8 pt-6 space-y-2 text-xs text-[#FAF7F2]/40" style={{ fontFamily: "var(--font-body)" }}>
                  <p>✓ Cancelamento gratuito até 7 dias antes</p>
                  <p>✓ Check-in: {item.check_in || "14:00"} · Check-out: {item.check_out || "11:00"}</p>
                  <p>✓ Atendimento personalizado</p>
                </div>
              </div>
            </aside>
          </div>

          {imgs.length > 1 && (
            <div className="mt-16">
              <h2 className="text-[#1C3A2A] text-2xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                Galeria
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {imgs.slice(1).map((src, index) => (
                  <div key={src} className="relative h-56 overflow-hidden">
                    <Image src={src} alt={`${item.titulo} ${index + 2}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
