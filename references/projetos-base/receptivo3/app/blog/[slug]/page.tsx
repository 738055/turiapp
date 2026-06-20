'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useContent } from '@/app/contexts/ContentContext';
import { notFound } from 'next/navigation';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { blogPosts } = useContent();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca o post baseado no slug da URL (ex: meudominio.com/blog/compras-paraguai)
    const fetchPost = async () => {
      const resolvedParams = await params;
      const foundPost = blogPosts.find(p => p.slug === resolvedParams.slug && p.active);
      setPost(foundPost);
      setLoading(false);
    };
    fetchPost();
  }, [params, blogPosts]);

  if (loading) return <PublicLayout><div className="py-20 text-center">Carregando...</div></PublicLayout>;
  if (!post) return notFound(); // Retorna página 404 bonita do Next.js se a matéria não existir

  return (
    <PublicLayout>
      <article className="bg-white min-h-screen pb-20">
        <div className="w-full h-[50vh] relative">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <Link href="/blog" className="text-white mb-6 flex items-center gap-2 hover:underline">
                <ArrowLeft size={16} /> Voltar para o blog
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{post.title}</h1>
              <div className="flex gap-4 text-white text-sm">
                <span className="flex items-center gap-1"><Calendar size={14}/> {post.date}</span>
                <span className="flex items-center gap-1"><User size={14}/> {post.author}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Renderiza o HTML vindo do seu CMS/Context */}
          <div 
            className="prose prose-lg prose-blue max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </PublicLayout>
  );
}
