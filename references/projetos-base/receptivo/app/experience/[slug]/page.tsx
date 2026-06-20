// a10receptivo2.0/app/experience/[slug]/page.tsx
import React from 'react';
import { TourService } from '@/services/tourService';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from '@/components/Link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const post = await TourService.getPostBySlug(params.slug);
  if (!post) return { title: 'Artigo não encontrado' };
  return {
    title: `${post.title.pt} | A10 Blog`,
    description: post.shortDesc.pt,
    openGraph: { images: [post.imageUrl] }
  };
}

export default async function ExperiencePage({ params }: Props) {
  const post = await TourService.getPostBySlug(params.slug);

  if (!post) notFound();

  // Idealmente, a seleção de idioma seria via URL (/pt/experience/...) ou cookie
  // Aqui usamos PT como padrão para SSR simples
  const lang = 'pt'; 

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
           <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 font-bold text-sm uppercase tracking-wide">
             <ArrowLeft size={16}/> Voltar para Home
           </Link>

           <div className="rounded-2xl overflow-hidden shadow-2xl mb-10 h-[400px]">
               <img src={post.imageUrl} className="w-full h-full object-cover" alt={post.title[lang]} />
           </div>

           <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6 leading-tight">
               {post.title[lang]}
           </h1>

           <p className="text-xl text-gray-500 mb-8 font-light italic border-l-4 border-secondary pl-6">
               {post.shortDesc[lang]}
           </p>

           <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed font-serif" 
                dangerouslySetInnerHTML={{ __html: post.content[lang] }} 
           />
        </div>
      </div>
    </div>
  );
}