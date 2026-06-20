'use client';

import React from 'react';
import { Star, Users, MapPin, CalendarCheck } from 'lucide-react';

interface Testimonial {
  name: string;
  origin: string;
  text: string;
  service: string;
}

// Depoimentos representativos — edite/conecte ao banco quando desejar.
const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Mariana Alves',
    origin: 'São Paulo, SP',
    service: 'Cataratas + Guia',
    text: 'Passeio impecável nas Cataratas. O guia conhecia cada detalhe e o transfer chegou no horário certinho. Recomendo de olhos fechados!',
  },
  {
    name: 'Carlos e Família',
    origin: 'Curitiba, PR',
    service: 'Transfer Aeroporto',
    text: 'Reservei o transfer pelo site em 2 minutos. Motorista pontual, veículo confortável e atendimento super atencioso com as crianças.',
  },
  {
    name: 'Júlia Fernandes',
    origin: 'Belo Horizonte, MG',
    service: 'City Tour + Itaipu',
    text: 'Organização nota 10. Receptivo cuidou de tudo: roteiro, ingressos e dicas locais. Senti que estava em boas mãos o tempo todo.',
  },
];

const STATS = [
  { icon: Users, value: '12.000+', label: 'Viajantes atendidos' },
  { icon: MapPin, value: '40+', label: 'Roteiros em Foz e região' },
  { icon: CalendarCheck, value: '4,9/5', label: 'Avaliação média' },
];

export const PratikSocialProof = () => {
  return (
    <section className="py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Métricas de confiança */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 border-b border-gray-100 pb-12">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center md:flex-row md:items-center md:gap-4 md:text-left md:justify-center">
              <div className="w-11 h-11 mb-2 md:mb-0 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-secondary leading-none">{value}</p>
                <p className="text-[13px] text-gray-500 mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <p className="text-primary-700 font-semibold text-sm mb-1.5">Quem viaja, recomenda</p>
          <h2 className="text-2xl md:text-3xl font-bold text-secondary">
            O que dizem nossos viajantes
          </h2>
        </div>

        {/* Depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-center gap-0.5 mb-4 text-accent" aria-label="5 de 5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-accent" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="text-secondary/90 leading-relaxed mb-6">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-secondary leading-tight">{t.name}</p>
                  <p className="text-[12px] text-gray-400">
                    {t.origin} · <span className="text-primary-700">{t.service}</span>
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
