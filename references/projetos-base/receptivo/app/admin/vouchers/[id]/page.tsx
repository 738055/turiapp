'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VoucherService } from '@/services/voucherService';
import { CompanyService } from '@/services/companyService';
import { VoucherFull, VoucherStatus } from '@/types';
import { generateVoucherHTML } from '@/components/admin/VoucherPrint';
import {
  ArrowLeft, Printer, CheckCircle, XCircle, Clock, Building2,
  User, CalendarDays, MapPin, FileText, DollarSign, Pencil
} from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const STATUS_OPTIONS: { value: VoucherStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'used', label: 'Utilizado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [voucher, setVoucher] = useState<VoucherFull | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingPaid, setEditingPaid] = useState(false);
  const [newAmountPaid, setNewAmountPaid] = useState(0);

  const fetch = async () => {
    setLoading(true);
    const data = await VoucherService.getById(id);
    setVoucher(data);
    if (data) setNewAmountPaid(data.amountPaid);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [id]);

  const handlePrint = async () => {
    if (!voucher) return;
    let company = undefined;
    if (voucher.companyId) {
      company = await CompanyService.getById(voucher.companyId);
    }
    const html = generateVoucherHTML(voucher, company);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return toast.error('Permita pop-ups para imprimir o voucher.');
    w.document.write(html);
    w.document.close();
  };

  const handleStatusChange = async (status: VoucherStatus) => {
    if (!voucher) return;
    setSavingStatus(true);
    try {
      await VoucherService.updateStatus(voucher.id, status);
      toast.success('Status atualizado.');
      fetch();
    } catch {
      toast.error('Erro ao atualizar status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSavePaid = async () => {
    if (!voucher) return;
    setSavingStatus(true);
    try {
      await VoucherService.updateAmountPaid(voucher.id, newAmountPaid);
      toast.success('Valor pago atualizado.');
      setEditingPaid(false);
      fetch();
    } catch {
      toast.error('Erro ao atualizar valor pago.');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Carregando voucher...</div>;
  if (!voucher) return (
    <div className="text-center py-24">
      <p className="text-red-500 mb-4">Voucher não encontrado.</p>
      <button onClick={() => router.push('/admin/vouchers')} className="text-primary underline">Voltar</button>
    </div>
  );

  const statusConfig: Record<string, { icon: React.ReactNode; classes: string }> = {
    active: { icon: <CheckCircle size={16} />, classes: 'text-green-700 bg-green-50 border-green-200' },
    used: { icon: <Clock size={16} />, classes: 'text-gray-600 bg-gray-100 border-gray-200' },
    cancelled: { icon: <XCircle size={16} />, classes: 'text-red-600 bg-red-50 border-red-200' },
  };
  const sc = statusConfig[voucher.status];

  return (
    <div className="pb-24 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/vouchers')} className="p-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800 font-mono">{voucher.voucherNumber}</h1>
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${sc.classes}`}>
                {sc.icon}
                {STATUS_OPTIONS.find(o => o.value === voucher.status)?.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-gray-400 text-sm">
                Emitido em {new Date(voucher.createdAt || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              {voucher.companyName && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {voucher.companyLanguage === 'en' ? '🇺🇸' : '🇧🇷'} {voucher.companyName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
          >
            <Printer size={18} /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main */}
        <div className="xl:col-span-2 space-y-6">

          {/* Dados da reserva */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User size={16} /> Dados da Reserva
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <Building2 size={11} /> Agência
                </div>
                <div className="font-semibold text-gray-800">{voucher.agencyName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <User size={11} /> Titular
                </div>
                <div className="font-semibold text-gray-800">{voucher.holderName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <CalendarDays size={11} /> Data do Serviço
                </div>
                <div className="font-semibold text-gray-800">{fmtDate(voucher.serviceDate)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <MapPin size={11} /> Hotel / Saída
                </div>
                <div className="font-semibold text-gray-800">{voucher.hotel || '—'}</div>
              </div>
              {voucher.pickupTime && (
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Horário Saída</div>
                  <div className="font-semibold text-gray-800">{voucher.pickupTime}</div>
                </div>
              )}
              {voucher.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Observações</div>
                  <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">{voucher.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Serviços e PAX */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FileText size={16} /> Serviços e PAX
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                  <th className="p-3 text-left rounded-l">Serviço</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-center">Tipo PAX</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Valor/PAX</th>
                  <th className="p-3 text-right rounded-r">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voucher.items.map(item =>
                  item.pax.map((p, pIdx) => (
                    <tr key={`${item.id}-${p.id}`} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">
                        {pIdx === 0 ? item.serviceName : ''}
                      </td>
                      <td className="p-3 text-gray-500">
                        {pIdx === 0 ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{item.serviceType}</span>
                        ) : ''}
                      </td>
                      <td className="p-3 text-center text-gray-700">{p.paxType}</td>
                      <td className="p-3 text-center font-bold">{p.quantity}</td>
                      <td className="p-3 text-right text-gray-600">{fmt(p.pricePerPax)}</td>
                      <td className="p-3 text-right font-semibold text-gray-800">{fmt(p.quantity * p.pricePerPax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financeiro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={16} /> Financeiro
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total PAX:</span>
                <span className="font-semibold">{voucher.totalPax}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total Serviços:</span>
                <span>{fmt(voucher.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Valor Pago:</span>
                <span>{fmt(voucher.amountPaid)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base border-t border-gray-100 pt-2 ${voucher.remainingBalance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                <span>Saldo Restante:</span>
                <span>{fmt(voucher.remainingBalance)}</span>
              </div>
            </div>

            {/* Edit amount paid */}
            {editingPaid ? (
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Novo valor pago</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newAmountPaid}
                      onChange={e => setNewAmountPaid(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSavePaid}
                    disabled={savingStatus}
                    className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setEditingPaid(false); setNewAmountPaid(voucher.amountPaid); }}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingPaid(true)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={14} /> Atualizar Valor Pago
              </button>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
            <h2 className="font-semibold text-gray-700">Alterar Status</h2>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={savingStatus || voucher.status === opt.value}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium border transition-colors text-left ${
                    voucher.status === opt.value
                      ? 'bg-primary text-white border-primary cursor-default'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-gray-900 rounded-xl font-bold hover:bg-yellow-500 transition-colors"
          >
            <Printer size={18} /> Gerar PDF / Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
