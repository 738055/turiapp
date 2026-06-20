'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Tipagem baseada no seu banco de dados
interface Partner {
  id: string;
  name: string;
  logo_url: string;
  is_active: boolean;
}

const PartnersCarousel = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePartners = async () => {
      try {
        // Busca apenas os parceiros ativos e ordena pelos mais recentes
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setPartners(data);
        }
      } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePartners();
  }, []);

  // Se estiver carregando ou não houver parceiros ativos cadastrados no admin, oculta a seção
  if (loading || partners.length === 0) {
    return null; 
  }

  return (
    <section className="bg-white py-12 border-t border-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-8">
        <h2 className="text-2xl font-bold text-secondary mb-2">Nossos Parceiros</h2>
        <p className="text-gray-500 text-sm">Empresas que confiam em nosso trabalho</p>
      </div>
      
      {/* Wrapper do Carrossel */}
      <div className="relative w-full flex overflow-x-hidden">
        {/* Usamos animate-marquee para o efeito contínuo, ou overflow-x-auto caso prefira scroll manual */}
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-6 items-center">
          
          {/* Primeira renderização da lista */}
          {partners.map((partner) => (
            <div key={`first-${partner.id}`} className="flex-none w-32 md:w-40 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
              <img 
                src={partner.logo_url} 
                alt={partner.name} 
                className="w-full h-auto max-h-16 object-contain" 
                title={partner.name}
              />
            </div>
          ))}

          {/* Segunda renderização (Duplicada) para criar o efeito de loop infinito sem "quebrar" a tela */}
          {partners.map((partner) => (
            <div key={`second-${partner.id}`} className="flex-none w-32 md:w-40 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
              <img 
                src={partner.logo_url} 
                alt={partner.name} 
                className="w-full h-auto max-h-16 object-contain" 
                title={partner.name}
              />
            </div>
          ))}
          
        </div>
      </div>
    </section>
  );
};

export default PartnersCarousel;
