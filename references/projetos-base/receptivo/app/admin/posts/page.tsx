// a10receptivo2.0/app/admin/posts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TourService } from '@/services/tourService';
import { BlogPost } from '@/types';
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Button from '@/components/Button';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    const data = await TourService.getAllPosts().catch(() => []);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      await TourService.deletePost(id);
      fetchPosts();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Blog & Info Carousel</h1>
            <p className="text-gray-500 text-sm">Gerencie os cards informativos da Home.</p>
        </div>
        <Link href="/admin/posts/new">
          <Button className="flex items-center gap-2">
            <Plus size={18} /> Novo Post
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Título & Conteúdo</th>
                <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                         {post.imageUrl && (
                             <img src={post.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                         )}
                         <div>
                            <div className="font-medium text-gray-900">{post.title.pt}</div>
                            <div className="text-xs text-gray-400 truncate max-w-xs">{post.slug}</div>
                         </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {post.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-100">
                            <CheckCircle2 size={12}/> Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-bold border border-gray-200">
                            <XCircle size={12}/> Inativo
                        </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <Link href={`/admin/posts/${post.slug}`}>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit size={18} />
                        </button>
                        </Link>
                        <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                        Nenhum post encontrado.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}