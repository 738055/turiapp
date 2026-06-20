'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AgencyService } from '@/services/agencyService';
import { Agency } from '@/types';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, Building2, Phone } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const data = await AgencyService.getAll();
    setAgencies(data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir a agência "${name}"? Vouchers existentes serão mantidos.`)) return;
    try {
      await AgencyService.delete(id);
      toast.success('Agência excluída.');
      fetchAll();
    } catch {
      toast.error('Erro ao excluir agência.');
    }
  };

  const filtered = agencies.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agências</h1>
          <p className="text-gray-500 text-sm mt-1">Parceiros e agências que compram serviços da A10</p>
        </div>
        <Link href="/admin/agencies/new">
          <Button className="flex items-center gap-2"><Plus size={18} /> Nova Agência</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, contato ou cidade..."
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-700 text-sm">limpar</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Agência</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cidade</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(ag => (
                <tr key={ag.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-primary">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{ag.name}</div>
                        {ag.cnpj && <div className="text-xs text-gray-400">CNPJ: {ag.cnpj}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700">{ag.contactPerson || '—'}</div>
                    {ag.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Phone size={11} /> {ag.phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{ag.city}{ag.state ? ` - ${ag.state}` : ''}</td>
                  <td className="p-4">
                    {ag.isActive ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                        <CheckCircle size={12} /> Ativa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit">
                        <XCircle size={12} /> Inativa
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/agencies/${ag.id}`}>
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar">
                          <Edit size={17} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(ag.id, ag.name)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    {search ? `Nenhuma agência encontrada para "${search}".` : 'Nenhuma agência cadastrada ainda.'}
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
