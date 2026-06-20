'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useContent } from '@/app/contexts/ContentContext';
import Link from 'next/link';
import { Ticket, ArrowRight, X, Search, SlidersHorizontal, CheckCircle } from 'lucide-react';

function TicketsSearchContent() {
  const { products, loading } = useContent();

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [sortOption, setSortOption] = useState('relevance');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Lógica de Filtragem (Foca apenas em 'ticket')
  const filteredTickets = useMemo(() => {
    let result = products.filter(p => {
      if (!p.active) return false;
      
      const isTicketType = p.type === 'ticket';
      // Permite que qualquer slug de categoria contendo "ingresso" seja aprovado
      const isTicketCategory = p.category && p.category.toLowerCase().includes('ingresso');

      return isTicketType || isTicketCategory;
    });

    // 2. Busca por Texto (continua igual o seu original)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) || 
        (p.description && p.description.toLowerCase().includes(lowerTerm))
      );
    }
    
    // 3. Filtro por Preço
    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    // 4. Ordenação
    switch (sortOption) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result.sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1));
    }

    return result;
  }, [products, searchTerm, priceRange, sortOption]);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: 2000 });
    setSortOption('relevance');
  };

  // Componente de Filtros Lateral
  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold text-secondary mb-2">Buscar ingresso</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Ex: Cataratas, Parque das Aves…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="pt-5 border-t border-gray-100">
        <h3 className="text-[13px] font-semibold text-secondary mb-3">Preço máximo</h3>
        <div className="px-1">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
            <span>R$ 0</span>
            <span>R$ {priceRange.max}</span>
          </div>
          <input
            type="range" min="0" max="2000" step="10"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-secondary border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Limpar filtros
      </button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Header Específico de Ingressos */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                <Ticket size={22} />
             </div>
             <h1 className="text-2xl md:text-3xl font-bold text-secondary">Ingressos</h1>
          </div>
          <p className="text-gray-500">Garanta sua entrada para as principais atrações de Foz, sem filas.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Main List */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-sm"
              >
                <SlidersHorizontal size={18} /> Filtros
              </button>
              
              <div className="ml-auto flex items-center gap-2">
                 <span className="text-sm text-gray-500 hidden sm:inline">Ordenar:</span>
                 <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-white border border-gray-200 text-secondary py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                 >
                    <option value="relevance">Relevância</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                 </select>
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-100">
                <Ticket size={40} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-secondary">Nenhum ingresso encontrado</h3>
                <button onClick={clearFilters} className="text-primary font-semibold mt-2">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                    <div className="relative h-44 overflow-hidden">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={ticket.imageUrl || '/placeholder.jpg'} alt={ticket.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute top-3 right-3 bg-white/95 px-2 py-1 rounded text-xs font-semibold text-secondary shadow-sm">
                          Ingresso digital
                       </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                       <h3 className="font-bold text-lg text-secondary mb-2">{ticket.name}</h3>
                       <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <CheckCircle size={14} className="text-success" />
                          <span>Entrega imediata por e-mail</span>
                       </div>
                       <p className="text-sm text-gray-600 line-clamp-2 mb-4">{ticket.description}</p>

                       <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                          <div>
                             <span className="text-[11px] text-gray-400 font-medium">A partir de</span>
                             <div className="text-xl font-bold text-secondary">{ticket.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                          </div>
                          <Link href={`/tours/${ticket.slug}`} className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5 text-sm font-semibold">
                             Ver <ArrowRight size={16} />
                          </Link>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Drawer Mobile */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl">Filtros</h2>
                <button onClick={() => setIsMobileFilterOpen(false)}><X size={24} /></button>
             </div>
             <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsSearchPage() {
  return (
    <PublicLayout>
       <Suspense fallback={null}>
         <TicketsSearchContent />
       </Suspense>
    </PublicLayout>
  );
}