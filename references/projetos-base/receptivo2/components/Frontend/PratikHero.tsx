'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Star, ShieldCheck, BadgeCheck, Users } from 'lucide-react';

export const PratikHero = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (date) params.set('date', date);
    const qs = params.toString();
    router.push(qs ? `/tours/search?${qs}` : '/tours/search');
  };

  return (
    <section className="relative bg-secondary overflow-hidden">
      {/* Imagem real das Cataratas + tratamento editorial (gradiente sólido, sem "orbs") */}
      <div className="absolute inset-0 z-0 bg-[url('/images/hero-cataratas.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/30" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-secondary via-transparent to-secondary/40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 lg:pt-48 lg:pb-28">
        <div className="max-w-3xl">
          {/* Credencial — sinal de agência de verdade */}
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-[0.18em] border border-white/15">
              <BadgeCheck size={14} className="text-sun" />
              Agência receptiva · Foz do Iguaçu
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/80 text-sm font-semibold">
              <Star size={15} className="text-sun fill-sun" />
              4,9 <span className="text-white/50 font-medium">· +12.000 viajantes</span>
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.02] mb-6">
            Conheça as Cataratas com quem é{' '}
            <span className="text-brand-gradient">de Foz.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/75 max-w-xl mb-10 leading-relaxed">
            Passeios, ingressos e transfers organizados por uma equipe local.
            Reserva online, confirmação imediata e atendimento de quem conhece a região.
          </p>

          {/* Barra de busca — formato de agência de viagem */}
          <div className="bg-white rounded-2xl shadow-premium p-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="flex-[1.4] flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <MapPin className="text-primary shrink-0" size={20} />
              <div className="text-left w-full">
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Passeio ou destino
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Cataratas, Itaipu, City Tour…"
                  className="w-full bg-transparent outline-none text-secondary font-semibold placeholder-gray-400"
                />
              </div>
            </div>
            <div className="hidden sm:block w-px bg-gray-100 my-2" />
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <Calendar className="text-primary shrink-0" size={20} />
              <div className="text-left w-full">
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-secondary font-semibold placeholder-gray-400 [color-scheme:light]"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="bg-accent hover:bg-accent-dark text-white px-7 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98]"
            >
              <Search size={20} />
              <span>Buscar</span>
            </button>
          </div>

          {/* Selos de confiança — credibilidade de empresa */}
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-9 text-white/70">
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={18} className="text-primary-300" />
              Cadastur ativo
            </span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <Users size={18} className="text-primary-300" />
              Guias credenciados
            </span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <BadgeCheck size={18} className="text-primary-300" />
              Pagamento em até 10x
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
