'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useContent } from '@/app/contexts/ContentContext';
import Link from 'next/link';
import { 
  Package, Star, ArrowRight, Filter, X, 
  Search, SlidersHorizontal, Gift, Calendar,
  CheckCircle // <--- ADICIONADO
} from 'lucide-react';
import { Product } from '@/app/types';

// Componente Wrapper para Suspense
function PackagesSearchContent() {
  const { products, loading } = useContent();

  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [sortOption, setSortOption] = useState('relevance');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Lógica de Filtragem
  const filteredPackages = useMemo(() => {
    // Filtra produtos do tipo 'package' OU que tenham a tag 'Combo'
    let result = products.filter(p => 
      (p.type === 'package' || p.tags?.includes('Combo')) && p.active
    );

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerTerm));
    }

    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    // Ordenação
    if (sortOption === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sortOption === 'price_desc') result.sort((a, b) => b.price - a.price);
    // Adicione mais lógicas de ordenação se necessário

    return result;
  }, [products, searchTerm, priceRange, sortOption]);

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold mb-4 flex items-center gap-2"><Filter size={18} /> Preço</h3>
        <div className="px-2">
           <input 
             type="range" 
             min="0" 
             max="5000" 
             step="100"
             value={priceRange.max}
             onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
             className="w-full accent-primary-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
           />
           <div className="flex justify-between text-sm text-gray-500 mt-2 font-medium">
             <span>R$ {priceRange.min}</span>
             <span>R$ {priceRange.max}</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-primary-900 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/cataratas-bg.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full text-sm font-bold mb-4 animate-fade-in-up">
            <Gift size={14} className="inline mr-2" /> Ofertas Especiais
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Pacotes & Combos Exclusivos</h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-2xl mx-auto mb-8 font-light">
            Economize até 30% combinando as melhores experiências de Foz do Iguaçu em um só pacote.
          </p>
          
          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full shadow-2xl max-w-2xl mx-auto flex items-center transform hover:scale-[1.01] transition-transform duration-300">
             <div className="pl-6 text-gray-400"><Search size={24} /></div>
             <input 
               type="text" 
               placeholder="Qual experiência você procura?" 
               className="flex-1 px-4 py-4 outline-none text-gray-700 text-lg bg-transparent"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-primary-200">
               Buscar
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 shrink-0">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                <FilterPanel />
             </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-6 flex justify-between items-center">
             <p className="font-bold text-gray-600">{filteredPackages.length} pacotes encontrados</p>
             <button 
               onClick={() => setIsMobileFilterOpen(true)}
               className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm font-bold text-primary-900 border border-gray-200"
             >
               <SlidersHorizontal size={18} /> Filtros
             </button>
          </div>

          {/* Products Grid */}
          <main className="flex-1">
            {loading ? (
               <div className="grid md:grid-cols-2 gap-6">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="bg-white h-96 rounded-3xl animate-pulse shadow-sm" />
                 ))}
               </div>
            ) : filteredPackages.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                  <Package size={64} className="mx-auto text-gray-200 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-400">Nenhum pacote encontrado</h3>
                  <p className="text-gray-400">Tente ajustar seus filtros de busca.</p>
               </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPackages.map((pkg: Product) => (
                  <div key={pkg.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col">
                    <div className="relative h-64 overflow-hidden">
                       <span className="absolute top-4 left-4 z-20 bg-yellow-400 text-primary-900 text-xs font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                          Combo
                       </span>
                       <img 
                         src={pkg.imageUrl} 
                         alt={pkg.name} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                       <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="text-2xl font-black leading-tight mb-1">{pkg.name}</h3>
                          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                             <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                               <Calendar size={12} /> Flexível
                             </span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                       <p className="text-gray-500 line-clamp-2 mb-4 text-sm leading-relaxed">
                         {pkg.shortDescription || pkg.description}
                       </p>

                       {/* Features / Inclusos */}
                       {pkg.features && pkg.features.length > 0 && (
                         <div className="mb-6 bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                            <span className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-2 block">Incluso no pacote:</span>
                            <ul className="text-sm text-gray-700 space-y-1">
                               {pkg.features.map((feature, index) => (
                                 <li key={index} className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> {feature}</li>
                               ))}
                            </ul>
                         </div>
                       )}

                       <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                          <div>
                             <span className="block text-xs text-gray-400 line-through font-medium">De {(pkg.price * 1.2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                             <div className="flex items-baseline gap-1">
                                <span className="text-sm text-gray-500 font-bold">Por</span>
                                <span className="text-2xl font-black text-primary-600">{pkg.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                             </div>
                          </div>
                          <Link href={`/tours/${pkg.slug}`} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-primary-200">
                             Ver Detalhes
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

export default function PackagesSearchPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-900"></div></div>}>
         <PackagesSearchContent />
      </Suspense>
    </PublicLayout>
  );
}