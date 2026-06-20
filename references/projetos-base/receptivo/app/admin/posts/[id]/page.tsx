// a10receptivo2.0/app/admin/posts/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import PostEditor from '@/components/admin/PostEditor';
import { TourService } from '@/services/tourService';
import { BlogPost } from '@/types';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta buscar pelo Slug (como foi linkado na lista) ou ID
    TourService.getPostBySlug(params.id).then(data => {
        if (data) {
            setPost(data);
            setLoading(false);
        } else {
            // Fallback se for ID (se getPostBySlug falhar, tente implementar getPostById no service se necessário, ou assuma que é slug)
             setLoading(false);
        }
    });
  }, [params.id]);

  if (loading) return <div>Carregando...</div>;
  if (!post) return <div>Post não encontrado.</div>;

  return <PostEditor initialData={post} isEditMode />;
}