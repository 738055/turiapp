// a10receptivo2.0/app/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Hero from '@/components/Hero';
import HotelBanner from '@/components/HotelBanner';
import InfoCarousel from '@/components/InfoCarousel';
import ToursGrid from '@/components/ToursGrid';
import Reviews from '@/components/Reviews';
import { TourService } from '@/services/tourService';
import Button from '@/components/Button';
import Link from '@/components/Link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

// --- AJUSTE DE CACHE ---
// 'force-dynamic': Obriga a página a ser gerada no servidor a cada acesso (sem cache estático).
// revalidate = 0: Garante que os dados buscados não fiquem presos em memória.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'A10 Receptivo | Turismo e Transfers em Foz do Iguaçu',
  description: 'Especialistas em receptivo em Foz do Iguaçu. Transfers privativos, passeios nas Cataratas, compras no Paraguai e muito mais com segurança e conforto.',
  keywords: 'foz do iguaçu, turismo, transfer, cataratas, compras paraguai, receptivo, a10'
};

export default async function Home() {
  // Busca APENAS os itens marcados como destaque no Admin
  const featuredTours = await TourService.getFeatured().catch(() => []);
  const posts = await TourService.getAllPosts().catch(() => []);

  return (
    <main className="min-h-screen bg-white">
      <Hero 
        title="Viva o Extraordinário em Foz do Iguaçu"
        subtitle="Sua experiência premium nas Cataratas começa aqui. Transfers privativos, roteiros exclusivos e atendimento bilíngue."
        videoUrl="https://yyfepxqhydjqjngytmxc.supabase.co/storage/v1/object/public/videos/VID-20260119-WA0153.mp4"
        imageUrl="/hero-cataratas.jpg" // Imagem de fallback caso o vídeo não carregue
      />
      
      {/* Seção de Valor / Intro */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
         <div className="container mx-auto px-4 text-center max-w-4xl">
             <span className="text-secondary font-bold tracking-widest uppercase text-sm mb-3 block">Bem-vindo à Foz</span>
             <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                 Viva Experiências Únicas na <br/><span className="text-primary">Terra das Cataratas</span>
             </h2>
             <p className="text-gray-600 text-lg leading-relaxed mb-10">
                 A <strong>A10 Receptivo</strong> cuida de todos os detalhes da sua viagem. Do momento que você pousa no aeroporto até os passeios mais incríveis, nossa missão é garantir segurança, pontualidade e momentos inesquecíveis para você e sua família.
             </p>
             
             <div className="flex flex-wrap justify-center gap-4 md:gap-12 mb-10">
                {['Atendimento 24h', 'Frota Privativa', 'Guias Credenciados', 'Roteiros Personalizados'].map((item) => (
                    <div key={item} className="flex items-center gap-2 font-bold text-gray-700">
                        <CheckCircle2 className="text-secondary" size={20} />
                        {item}
                    </div>
                ))}
             </div>
         </div>
      </section>

      {/* Info Carousel (Blog/Info) */}
      <InfoCarousel posts={posts} />

      {/* Destaques (Nossas Seleções) */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
           <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Nossas Seleções</h2>
              <p className="text-gray-500 mt-2">Os passeios mais desejados e exclusivos para você.</p>
           </div>
           <Link href="/experiencias">
             <Button variant="outline" className="flex items-center gap-2">
               Ver Todas as Experiências <ArrowRight size={16}/>
             </Button>
           </Link>
        </div>

        {/* Mostra os destaques selecionados no Admin */}
        {featuredTours.length > 0 ? (
            <ToursGrid tours={featuredTours} />
        ) : (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <p>Nenhum destaque selecionado no momento.</p>
                <p className="text-xs mt-2">Vá ao Admin e marque a opção "Destaque" em um passeio.</p>
            </div>
        )}
        
        <div className="mt-12 text-center md:hidden">
            <Link href="/experiencias">
                <Button fullWidth variant="outline">Ver Catálogo Completo</Button>
            </Link>
        </div>
      </section>

      <HotelBanner />
      
      <Reviews />
    </main>
  );
}