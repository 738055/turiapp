'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TourService } from '@/services/tourService';
import { Tour } from '@/types';
import { Plus, Edit, Trash2, Eye, Search, MapPin, DollarSign } from 'lucide-react';
import Button from '@/components/Button';

export default function AdminExperiencesPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTours = async () => {
    setLoading(true);
    const data = await TourService.getAll().catch(() => []);
    setTours(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta experiência? Esta ação não pode ser desfeita.')) {
      await TourService.delete(id);
      fetchTours();
    }
  };

  // Função para salvar a ordem automaticamente ao sair do campo
  const handleOrderChange = async (id: string, newOrder: string) => {
      const order = parseInt(newOrder);
      if (isNaN(order)) return;

      // Atualiza visualmente primeiro para ser rápido
      setTours(prev => prev.map(t => t.id === id ? { ...t, displayOrder: order } : t));

      // Salva no banco
      try {
          await TourService.update(id, { displayOrder: order });
      } catch (error) {
          console.error("Erro ao salvar ordem", error);
          alert("Erro ao salvar a ordem. Tente novamente.");
      }
  };

  // Filtragem local
  const filteredTours = tours.filter(t => 
    t.title?.pt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Gerenciar Experiências</h1>
            <p className="text-gray-500 text-sm">Lista de todos os passeios cadastrados no sistema.</p>
        </div>
        <Link href="/admin/experiences/new">
          <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
            <Plus size={18} /> Nova Experiência
          </Button>
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
         <Search className="text-gray-400" size={20} />
         <input 
            type="text"
            placeholder="Buscar por nome ou categoria..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* Tabela de Dados */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando experiências...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider w-20 text-center">Ordem</th>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Experiência</th>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Local & Categoria</th>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Preço Base</th>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Coluna de Ordem */}
                    <td className="p-5 text-center">
                        <input 
                            type="number"
                            defaultValue={tour.displayOrder || 9999}
                            className="w-16 p-2 border border-gray-200 rounded text-center font-bold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                            onBlur={(e) => handleOrderChange(tour.id, e.target.value)}
                            title="Defina a ordem de exibição (1 = primeiro)"
                        />
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                            {tour.image ? (
                                <img src={tour.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 text-xs">Sem img</div>
                            )}
                          </div>
                          <div>
                             <div className="font-bold text-gray-800 line-clamp-1">{tour.title?.pt || 'Sem Título'}</div>
                             <div className="text-xs text-gray-400 mt-0.5">ID: {tour.id.slice(0, 8)}...</div>
                          </div>
                      </div>
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1 text-xs text-gray-600">
                                <MapPin size={12} className="text-secondary" />
                                {tour.location?.pt || '-'}
                           </div>
                           <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] uppercase font-bold w-fit">
                                {tour.category || 'Geral'}
                           </span>
                       </div>
                    </td>
                    <td className="p-5">
                        <div className="flex items-center gap-1 font-mono text-gray-700 text-sm font-medium">
                            <DollarSign size={14} className="text-gray-400" />
                            {tour.basePrice > 0 ? tour.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        </div>
                    </td>
                    <td className="p-5">
                      {tour.status === 'published' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Publicado
                          </span>
                      ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Rascunho
                          </span>
                      )}
                      {tour.featured && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase rounded border border-yellow-100">
                              Destaque
                          </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Link href={`/tour/${tour.slug}`} target="_blank" title="Ver no Site">
                                <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Eye size={18} />
                                </button>
                            </Link>
                            <Link href={`/admin/experiences/${tour.id}`} title="Editar">
                                <button className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                            </Link>
                            <button 
                                onClick={() => handleDelete(tour.id)}
                                title="Excluir"
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {filteredTours.length === 0 && (
                   <tr>
                       <td colSpan={6} className="p-12 text-center text-gray-400">
                           Nenhuma experiência encontrada.
                       </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}