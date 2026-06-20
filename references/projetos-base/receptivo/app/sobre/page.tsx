// a10receptivo2.0/app/sobre/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Shield, Clock, Heart, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quem Somos | A10 Receptivo Foz do Iguaçu',
  description: 'Conheça a história da A10 Receptivo. Mais de uma década oferecendo excelência em turismo e transporte executivo na Tríplice Fronteira.',
};

export default function AboutPage() {
  return (
    <main className="pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Nossa História
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
                Fundada com a missão de elevar o padrão do turismo em Foz do Iguaçu, a A10 Receptivo combina a hospitalidade brasileira com a eficiência logística necessária para uma viagem perfeita.
            </p>
        </div>

        {/* Imagem + Texto */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                 <img 
                    src="https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=1000&auto=format&fit=crop" 
                    alt="Cataratas do Iguaçu" 
                    className="w-full h-full object-cover"
                 />
            </div>
            <div className="space-y-6">
                <h3 className="text-3xl font-serif font-bold text-primary">Por que existimos?</h3>
                <p className="text-gray-600 leading-relaxed">
                    Acreditamos que viajar é colecionar memórias. Por isso, eliminamos as preocupações logísticas. Somos anfitriões que conhecem cada canto da cidade, os melhores horários para visitar os atrativos e aquele restaurante especial que só os locais conhecem.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <Shield className="text-secondary mb-3" size={32} />
                        <h4 className="font-bold text-gray-900 mb-2">Segurança Total</h4>
                        <p className="text-sm text-gray-600">Veículos monitorados e revisados, com seguro total para passageiros.</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <Heart className="text-secondary mb-3" size={32} />
                        <h4 className="font-bold text-gray-900 mb-2">Atendimento Humano</h4>
                        <p className="text-sm text-gray-600">Nada de robôs. Nossa equipe está disponível via WhatsApp para qualquer necessidade.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-primary rounded-3xl p-12 text-white text-center grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
                { label: 'Anos de Experiência', value: '10+' },
                { label: 'Clientes Atendidos', value: '15k+' },
                { label: 'Destinos', value: '20+' },
                { label: 'Avaliação Média', value: '5.0' },
            ].map((stat, i) => (
                <div key={i}>
                    <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                    <div className="text-white/70 uppercase tracking-wider text-xs font-bold">{stat.label}</div>
                </div>
            ))}
        </div>
      </div>
    </main>
  );
}