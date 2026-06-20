'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { VoucherService } from '@/services/voucherService';
import { VoucherWithTotals } from '@/types';
import { Plus, Eye, Trash2, Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    active: { label: 'Ativo', classes: 'text-green-700 bg-green-50', icon: <CheckCircle size={12} /> },
    used: { label: 'Utilizado', classes: 'text-gray-600 bg-gray-100', icon: <Clock size={12} /> },
    cancelled: { label: 'Cancelado', classes: 'text-red-600 bg-red-50', icon: <XCircle size={12} /> },
  };
  const s = map[status] || map.active;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${s.classes}`}>
      {s.icon} {s.label}
    </span>
  );
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const data = await VoucherService.getAll();
    setVouchers(data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Excluir voucher ${num}? Esta ação não pode ser desfeita.`)) return;
    try {
      await VoucherService.delete(id);
      toast.success('Voucher excluído.');
      fetchAll();
    } catch {
      toast.error('Erro ao excluir voucher.');
    }
  };

  const filtered = vouchers.filter(v =>
    v.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.holderName.toLowerCase().includes(search.toLowerCase()) ||
    v.agencyName.toLowerCase().includes(search.toLowerCase())
  );

  const totalAtivos = vouchers.filter(v => v.status === 'active').length;
  const totalSaldo = vouchers.filter(v => v.status === 'active').reduce((s, v) => s + v.remainingBalance, 0);

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vouchers</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os vouchers de serviços emitidos para agências</p>
        </div>
        <Link href="/admin/vouchers/new">
          <Button className="flex items-center gap-2"><Plus size={18} /> Novo Voucher</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Total de Vouchers</div>
          <div className="text-2xl font-bold text-gray-800">{vouchers.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Vouchers Ativos</div>
          <div className="text-2xl font-bold text-green-700">{totalAtivos}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Saldo a Receber</div>
          <div className="text-2xl font-bold text-orange-600">{fmt(totalSaldo)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por número, titular ou agência..."
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
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Voucher</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Agência / Titular</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data Serviço</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Pago</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Saldo</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-50 rounded-full flex items-center justify-center text-primary">
                        <FileText size={14} />
                      </div>
                      <span className="font-mono text-sm font-semibold text-gray-800">{v.voucherNumber}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 ml-9">
                      {new Date(v.createdAt || '').toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 text-sm">{v.agencyName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{v.holderName}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">{fmtDate(v.serviceDate)}</td>
                  <td className="p-4 text-right font-semibold text-gray-800">{fmt(v.totalAmount)}</td>
                  <td className="p-4 text-right text-green-700 font-semibold">{fmt(v.amountPaid)}</td>
                  <td className={`p-4 text-right font-bold ${v.remainingBalance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                    {fmt(v.remainingBalance)}
                  </td>
                  <td className="p-4"><StatusBadge status={v.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/vouchers/${v.id}`}>
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver / Imprimir">
                          <Eye size={17} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(v.id, v.voucherNumber)}
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
                  <td colSpan={8} className="p-10 text-center text-gray-400">
                    {search ? `Nenhum voucher encontrado para "${search}".` : 'Nenhum voucher emitido ainda.'}
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
