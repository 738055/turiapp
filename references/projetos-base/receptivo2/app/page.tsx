'use client';

import React, { useRef } from 'react';
import { ArrowRight, ShieldCheck, Headphones, CreditCard, ChevronLeft, ChevronRight, Zap, Trophy, Map, Plane, Star, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContent } from '@/app/contexts/ContentContext';
import PromoModal from '@/components/PromoModal';
import { ProductCard } from '@/components/ProductCard';
import { PratikNavbar } from '@/components/Frontend/PratikNavbar';
import { PratikHero } from '@/components/Frontend/PratikHero';
import { PratikSocialProof } from '@/components/Frontend/PratikSocialProof';
import { PratikFooter } from '@/components/Frontend/PratikFooter';

export default function HomePage() {
  const { getFeaturedProducts, categories } = useContent();
  const featuredProducts = getFeaturedProducts();
  const router = useRouter();

  const sliderRef = useRef<HTMLDivElement>(null);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'transfers': return <Plane size={20} />;
      case 'passeios': return <Map size={20} />;
      case 'ingressos': return <Zap size={20} />;
      case 'combos': return <Trophy size={20} />;
      default: return <Star size={20} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PratikNavbar />

      <main className="flex-grow">
        <PratikHero />

        <PromoModal />

        {/* --- NAVEGAÇÃO POR CATEGORIA --- */}
        <section className="bg-white border-b border-gray-100 py-8 md:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-bold text-secondary">O que você procura?</h2>
              <Link href="/categories" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                Ver categorias
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.length > 0 ? categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(cat.slug === 'transfers' ? '/transfers/search' : `/tours/search?category=${cat.slug}`)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-primary hover:bg-primary-50/40 transition-colors text-left group"
                >
                  <span className="w-11 h-11 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    {getCategoryIcon(cat.slug)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-secondary truncate">{cat.label}</span>
                    <span className="block text-[12px] text-gray-400 group-hover:text-primary transition-colors">Ver opções →</span>
                  </span>
                </button>
              )) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[76px] bg-gray-100 animate-pulse rounded-xl" />
                ))
              )}
            </div>
          </div>
        </section>

        {/* --- MAIS RESERVADOS --- */}
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-primary-700 font-semibold text-sm mb-1.5">Destaques da região</p>
                <h2 className="text-2xl md:text-3xl font-bold text-secondary">
                  Mais reservados em Foz do Iguaçu
                </h2>
                <p className="text-gray-500 mt-2 max-w-xl">
                  As experiências preferidas de quem visita a Terra das Cataratas.
                </p>
              </div>
              <Link
                href="/tours/search"
                className="hidden sm:inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-dark transition-colors shrink-0"
              >
                Ver tudo <ArrowRight size={18} />
              </Link>
            </div>

            <div className="relative">
              <button
                onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-secondary hover:bg-gray-50 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() => sliderRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-secondary hover:bg-gray-50 transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight size={22} />
              </button>

              <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              >
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <div key={product.id} className="shrink-0 snap-start">
                    <ProductCard product={product} layout="vertical" />
                  </div>
                )) : (
                  <div className="w-full text-center p-16 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400">Nenhum passeio disponível no momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- PROVA SOCIAL --- */}
        <PratikSocialProof />

        {/* --- POR QUE RESERVAR COM A PRATIK --- */}
        <section className="py-14 md:py-20 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-2">
              Por que reservar com a Pratik
            </h2>
            <p className="text-gray-500 mb-10 max-w-xl">
              Agência receptiva local — do aeroporto às Cataratas, cuidamos de cada detalhe.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: ShieldCheck, title: 'Pagamento seguro', desc: 'Reserva online com confirmação imediata e transações criptografadas.' },
                { icon: Headphones, title: 'Suporte local em Foz', desc: 'Equipe na cidade para atender você antes, durante e depois do passeio.' },
                { icon: CreditCard, title: 'Parcele em até 10x', desc: 'Organize sua viagem com tranquilidade e divida os passeios sem juros.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-secondary text-lg mb-1.5">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CTA DE CONTATO (real, no lugar do mockup) --- */}
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-secondary rounded-2xl px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Quer um roteiro montado para você?
                </h2>
                <p className="text-white/70 leading-relaxed">
                  Fale com a nossa equipe pelo WhatsApp e receba uma sugestão de roteiro
                  personalizada para os seus dias em Foz do Iguaçu — sem compromisso.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="https://wa.me/5545999406579"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <MessageCircle size={18} /> Falar no WhatsApp
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-white/15"
                >
                  <Phone size={18} /> Central de ajuda
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PratikFooter />
    </div>
  );
}
