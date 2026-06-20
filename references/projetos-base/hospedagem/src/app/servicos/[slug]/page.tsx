import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CTASection from "@/components/sections/CTASection";
import { supabase } from "@/lib/supabase";
import type { Servico } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";
import { Compass, MessageCircle } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

async function getServico(slug: string) {
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Servico | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const servico = await getServico(slug);

  if (!servico) return { title: "Serviço não encontrado" };

  return {
    title: servico.seo_titulo || servico.titulo,
    description: servico.seo_descricao || servico.descricao || undefined,
    openGraph: {
      images: servico.imagens?.length ? servico.imagens : servico.imagem_url ? [servico.imagem_url] : [],
    },
  };
}

export default async function ServicoPage({ params }: Props) {
  const { slug } = await params;
  const servico = await getServico(slug);

  if (!servico) notFound();

  const image = servico.imagens?.[0] || servico.imagem_url || "https://images.unsplash.com/photo-1548019979-e9d4b98d0e85?w=1200&q=80";
  const categoria = servico.categoria || "experiencia";

  return (
    <>
      <Header />
      <main className="pt-20 bg-[#FAF7F2]">
        <section className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
          <div className="relative min-h-[420px] lg:min-h-0">
            <Image src={image} alt={servico.titulo} fill priority className="object-cover" />
            <div className="absolute inset-0 bg-[#1C3A2A]/15" />
          </div>
          <div className="flex items-center px-6 py-20 lg:px-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-5" style={{ fontFamily: "var(--font-body)" }}>
                <Compass className="w-4 h-4" strokeWidth={1.5} />
                {categoria}
              </div>
              <h1 className="text-[#1C3A2A] text-[clamp(2.75rem,6vw,5rem)] leading-tight mb-8" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                {servico.titulo}
              </h1>
              {servico.descricao && (
                <p className="text-[#1C3A2A]/70 text-lg leading-relaxed mb-8" style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  {servico.descricao}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <a
                  href={`https://wa.me/5545999999999?text=${encodeURIComponent(`Olá! Tenho interesse em ${servico.titulo}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center gap-2 bg-[#C4623A] text-white px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Solicitar
                </a>
                <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                  {servico.preco ? `${formatCurrency(servico.preco)}${servico.unidade ? ` / ${servico.unidade}` : ""}` : "Sob consulta"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <CTASection />
      <Footer />
    </>
  );
}
