// app/admin/categories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryService } from '@/services/categoryService';
import { Category } from '@/types';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/Button';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCats = async () => {
    setLoading(true);
    const data = await CategoryService.getAll();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Isso pode afetar passeios vinculados a esta categoria.')) {
      await CategoryService.delete(id);
      fetchCats();
    }
  };

  const filtered = categories.filter(c => 
      c.name.pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
        <Link href="/admin/categories/new">
          <Button className="flex items-center gap-2"><Plus size={18}/> Nova Categoria</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
         <Search className="text-gray-400" size={20} />
         <input 
            type="text"
            placeholder="Buscar categoria..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-600 uppercase">Nome (PT)</th>
                        <th className="p-4 text-xs font-bold text-gray-600 uppercase">Slug</th>
                        <th className="p-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-600 uppercase text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtered.map(cat => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-800">{cat.name.pt}</td>
                            <td className="p-4 font-mono text-sm text-gray-500">{cat.slug}</td>
                            <td className="p-4">
                                {cat.isActive ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                        <CheckCircle size={12}/> Ativa
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit">
                                        <XCircle size={12}/> Inativa
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/admin/categories/${cat.id}`}>
                                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                                    </Link>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma categoria encontrada.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}