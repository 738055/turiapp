'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import Link from 'next/link';
import {
  Edit, Trash2, Plus, Search, Filter, Eye, EyeOff, Loader2, AlertTriangle, X,
} from 'lucide-react';
import { Product } from '@/app/types';

// ── Modal de confirmação de exclusão ────────────────────────────────────────
function DeleteConfirmModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Excluir produto?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação é <strong>irreversível</strong>. O produto e todos os seus
                dados serão removidos permanentemente.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 flex items-center gap-3">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm">{product.name}</p>
              <p className="text-xs text-gray-500">{product.slug}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {loading ? 'Excluindo...' : 'Sim, excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`*, categories:category_id (slug)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.title,
          slug: p.slug,
          description: p.description || '',
          price: p.price,
          category: (p.categories as any)?.slug || 'sem-categoria',
          imageUrl: p.images?.[0] || '/images/placeholder.jpg',
          gallery: p.images || [],
          active: p.availability ?? false,
          isFeatured: p.featured ?? false,
          type: p.metadata?.type || 'tour',
          rating: p.rating,
          reviewsCount: p.reviews_count,
        }));
        setProducts(formatted);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ availability: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !currentStatus } : p)));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Não foi possível atualizar o status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      alert(`Erro ao excluir: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* Modal de confirmação */}
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingProduct(null)}
          loading={deleteLoading}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            <p className="text-sm text-gray-500">Gerencie passeios, transfers e ingressos.</p>
          </div>
          <Link href="/admin/products/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm">
              <Plus size={16} /> Novo Produto
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar produto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors">
              <Filter size={16} /> Filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center mb-2">
                        <Loader2 className="animate-spin" />
                      </div>
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-md object-cover bg-gray-200"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(product.id, product.active || false)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                            product.active
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {product.active ? (
                            <>
                              <Eye size={12} /> Ativo
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} /> Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/products/edit/${product.id}`}>
                            <button
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
