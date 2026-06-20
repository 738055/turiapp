'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CompanyService } from '@/services/companyService';
import { Company } from '@/types';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Globe } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const data = await CompanyService.getAll();
    setCompanies(data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir a empresa "${name}"? Vouchers existentes serão mantidos.`)) return;
    try {
      await CompanyService.delete(id);
      toast.success('Empresa excluída.');
      fetchAll();
    } catch {
      toast.error('Erro ao excluir. Verifique se há vouchers vinculados.');
    }
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas Emissoras</h1>
          <p className="text-gray-500 text-sm mt-1">
            Empresas que emitem vouchers · selecione ao criar um voucher
          </p>
        </div>
        <Link href="/admin/companies/new">
          <Button className="flex items-center gap-2"><Plus size={18} /> Nova Empresa</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: c.primaryColor || '#0A6640' }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{c.name}</div>
                    {c.cnpj && <div className="text-xs text-gray-400">{c.cnpj}</div>}
                  </div>
                </div>
                {c.isActive ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle size={11} /> Ativa
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <XCircle size={11} /> Inativa
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium">
                    {c.language === 'en' ? '🇺🇸 English (PDF em Inglês)' : '🇧🇷 Português (PDF em PT-BR)'}
                  </span>
                </div>
                {c.phone && <div className="text-gray-500 text-xs">{c.phone}</div>}
                {c.email && <div className="text-gray-500 text-xs truncate">{c.email}</div>}
              </div>

              {/* Cor */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ background: c.primaryColor || '#0A6640' }}
                />
                <span className="text-xs text-gray-400 font-mono">{c.primaryColor || '#0A6640'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <Link href={`/admin/companies/${c.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit size={15} /> Editar
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-400 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={15} /> Excluir
                </button>
              </div>
            </div>
          ))}

          {companies.length === 0 && (
            <div className="col-span-3 p-10 text-center text-gray-400">
              Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
