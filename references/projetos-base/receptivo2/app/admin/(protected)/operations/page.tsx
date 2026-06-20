'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import {
  Plus, Search, ClipboardList, Calendar, Filter, ChevronDown,
  Eye, Trash2, UserCheck, Plane, MapPin,
} from 'lucide-react';
import type { ServiceOrder, DriverGuide } from '@/app/types';

const DOC_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  os: { label: 'OS', color: 'bg-primary-100 text-primary-700' },
  agenda: { label: 'Agenda', color: 'bg-teal-100 text-teal-700' },
  manifesto: { label: 'Manifesto', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmada', color: 'bg-primary-100 text-primary-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

export default function OperationsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [guides, setGuides] = useState<DriverGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: os }, { data: g }] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*, assigned_guide:drivers_guides(id, name, phone)')
        .order('date_in', { ascending: false }),
      supabase.from('drivers_guides').select('*').eq('status', 'active'),
    ]);
    if (os) setOrders(os as any);
    if (g) setGuides(g);
    setLoading(false);
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta OS? Todos os dados relacionados serão perdidos.')) return;
    const { error } = await supabase.from('service_orders').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (dateFilter && o.date_in !== dateFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.os_number.toLowerCase().includes(q) ||
        o.lead_passenger_name.toLowerCase().includes(q) ||
        (o.agency_name || '').toLowerCase().includes(q) ||
        (o.hotel_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d: string) => {
    try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); }
    catch { return d; }
  };

  // Group by date for calendar view
  const groupedByDate: Record<string, ServiceOrder[]> = {};
  filteredOrders.forEach(o => {
    const key = o.date_in;
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(o);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={28} className="text-primary-600" /> Operacoes — Documentos
          </h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} documentos no sistema</p>
        </div>
        <button
          onClick={() => router.push('/admin/operations/new')}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-700 shadow-sm"
        >
          <Plus size={18} /> Novo Documento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 pl-9 pr-4 py-2.5 rounded-lg text-sm"
              placeholder="Buscar por OS, passageiro, agência ou hotel..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 px-4 py-2.5 rounded-lg text-sm bg-white min-w-[150px]"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-200 px-4 py-2.5 rounded-lg text-sm"
          />
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2.5 text-sm font-medium ${viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2.5 text-sm font-medium ${viewMode === 'calendar' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Diário
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <ClipboardList size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 mt-3 font-medium">Nenhuma OS encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Crie uma nova Ordem de Serviço para começar.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Passageiro</th>
                  <th className="px-4 py-3">Agência</th>
                  <th className="px-4 py-3">Hotel</th>
                  <th className="px-4 py-3">IN</th>
                  <th className="px-4 py-3">OUT</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Guia</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => {
                  const guide = (o as any).assigned_guide;
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.draft;
                  return (
                    <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-black text-primary-700">{o.os_number}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const dt = DOC_TYPE_BADGE[(o as any).doc_type || 'os'];
                          return <span className={`text-xs font-bold px-2 py-0.5 rounded ${dt.color}`}>{dt.label}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 font-medium">{o.lead_passenger_name}</td>
                      <td className="px-4 py-3 text-gray-600">{o.agency_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{o.hotel_name || '-'}</td>
                      <td className="px-4 py-3">{formatDate(o.date_in)}</td>
                      <td className="px-4 py-3">{formatDate(o.date_out)}</td>
                      <td className="px-4 py-3">{o.pax_count + o.children_count}</td>
                      <td className="px-4 py-3">
                        {guide ? (
                          <span className="text-emerald-700 font-medium">{guide.name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Não alocado</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/admin/operations/${o.id}`)}
                            className="p-1.5 rounded hover:bg-primary-50 text-primary-600"
                            title="Ver / Editar"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── CALENDAR/DAILY VIEW ── */
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-primary-50 border-b border-primary-100 px-5 py-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary-600" />
                <span className="font-bold text-primary-800">{formatDate(date)}</span>
                <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full ml-2">{groupedByDate[date].length} OS</span>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedByDate[date].map(o => {
                  const guide = (o as any).assigned_guide;
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.draft;
                  return (
                    <div
                      key={o.id}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => router.push(`/admin/operations/${o.id}`)}
                    >
                      <div className="shrink-0 text-center">
                        <p className="text-xl font-black text-primary-700">{o.os_number}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DOC_TYPE_BADGE[(o as any).doc_type || 'os'].color}`}>{DOC_TYPE_BADGE[(o as any).doc_type || 'os'].label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${sc.color}`}>{sc.label}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{o.lead_passenger_name}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                          {o.agency_name && <span>{o.agency_name}</span>}
                          {o.hotel_name && <span className="flex items-center gap-1"><MapPin size={11} /> {o.hotel_name}</span>}
                          <span>{o.pax_count} adultos{o.children_count > 0 ? `, ${o.children_count} crianças` : ''}</span>
                        </div>
                      </div>
                      {guide && (
                        <div className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                          <UserCheck size={14} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-700">{guide.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
