'use client';

import React, { Suspense } from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useContent } from '@/app/contexts/ContentContext';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';

function CategoriesContent() {
  const { categories, products, loading } = useContent();

  // Função auxiliar para contar produtos por categoria
  const getProductCount = (catId: string) => {
    return products.filter(p => p.category === catId && p.active).length;
  };

  // Renderiza ícone dinâmico
  const renderIcon = (iconName: string, size = 24) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent size={size} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Cabeçalho */}
      <div className="bg-gray-50 border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-primary-700 font-semibold text-sm mb-1.5">Catálogo</p>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Explore por categoria</h1>
          <p className="text-gray-500 max-w-2xl">
            Encontre a experiência ideal para a sua viagem — de passeios nas Cataratas a
            transfers e compras no Paraguai.
          </p>
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.filter(c => c.active).map((category) => {
            const count = getProductCount(category.id);

            return (
              <Link
                key={category.id}
                href={`/tours/search?category=${category.id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-50 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    {renderIcon(category.icon, 24)}
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded">
                    {count} experiências
                  </span>
                </div>

                <h3 className="text-lg font-bold text-secondary mb-2 group-hover:text-primary transition-colors">
                  {category.label}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2">
                  {category.description || `Opções de ${category.label.toLowerCase()} em Foz do Iguaçu.`}
                </p>

                <div className="mt-auto flex items-center text-primary font-semibold text-sm">
                  Explorar <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Seção Informativa Inferior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-secondary rounded-2xl px-6 py-10 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-2">Não sabe por onde começar?</h2>
            <p className="text-white/70">
              Fale com nossos especialistas locais e monte um roteiro personalizado para os seus dias em Foz.
            </p>
          </div>
          <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shrink-0">
            Falar com consultor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <PublicLayout>
      <Suspense fallback={null}>
        <CategoriesContent />
      </Suspense>
    </PublicLayout>
  );
}