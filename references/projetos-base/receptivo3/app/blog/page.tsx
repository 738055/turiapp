'use client';

import React from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useContent } from '@/app/contexts/ContentContext';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogListPage() {
  const { blogPosts } = useContent();
  // CORREÇÃO: Pega os que estão "active" OU "published"
  const activePosts = blogPosts.filter(p => p.active || (p as any).published === true);

  return (
    <PublicLayout>
      {/* Cabeçalho */}
      <div className="bg-gray-50 py-12 md:py-16 border-b border-gray-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-primary-700 font-semibold text-sm mb-1.5">Blog</p>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Dicas da fronteira</h1>
            <p className="text-gray-500 max-w-2xl">
               As melhores dicas de compras, gastronomia e passeios em Foz do Iguaçu, Paraguai e Argentina.
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePosts.map(post => (
               <article key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col h-full">
                  <div className="h-48 overflow-hidden relative">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                     />
                     <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded text-xs font-semibold text-secondary">
                        Dicas
                     </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                     <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {post.date}</span>
                        <span className="flex items-center gap-1"><User size={12}/> {post.author}</span>
                     </div>

                     <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-lg font-bold text-secondary mb-2 group-hover:text-primary transition-colors leading-snug">
                           {post.title}
                        </h2>
                     </Link>

                     <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                     </p>

                     <div className="mt-auto pt-4 border-t border-gray-100">
                        <Link
                           href={`/blog/${post.slug}`}
                           className="text-primary font-semibold text-sm inline-flex items-center gap-1.5"
                        >
                           Ler matéria completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </Link>
                     </div>
                  </div>
               </article>
            ))}
         </div>
      </div>
    </PublicLayout>
  );
};