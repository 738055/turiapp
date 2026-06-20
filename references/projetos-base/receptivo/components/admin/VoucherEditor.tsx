'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgencyService } from '@/services/agencyService';
import { CompanyService } from '@/services/companyService';
import { VoucherService } from '@/services/voucherService';
import { Agency, Company, VoucherCreateInput, VoucherItemInput, VoucherPaxInput } from '@/types';
import {
  Save, ArrowLeft, Loader2, Plus, Trash2, ChevronDown,
  User, Building2, CalendarDays, MapPin, Clock, DollarSign, FileText, Briefcase
} from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

// ─── Opções por idioma ────────────────────────────────────────────────────────
const SERVICE_TYPES: Record<'pt' | 'en', string[]> = {
  pt: ['Tour / Passeio', 'Transfer', 'Hospedagem', 'Ingresso / Entrada', 'Pacote', 'Outro'],
  en: ['Tour / Excursion', 'Transfer', 'Accommodation', 'Ticket / Entry', 'Package', 'Other'],
};

const PAX_TYPES: Record<'pt' | 'en', string[]> = {
  pt: ['Adulto', 'Criança (0–5 anos)', 'Criança (6–11 anos)', 'Menor (12–17 anos)', 'Melhor Idade (60+)', 'Bebê'],
  en: ['Adult', 'Child (0–5 years)', 'Child (6–11 years)', 'Youth (12–17 years)', 'Senior (60+)', 'Infant'],
};

// ─── Factory functions cientes do idioma ──────────────────────────────────────
const newPax = (lang: 'pt' | 'en' = 'pt'): VoucherPaxInput => ({
  tempId: crypto.randomUUID(),
  paxType: PAX_TYPES[lang][0],
  quantity: 1,
  pricePerPax: 0,
});

const newItem = (lang: 'pt' | 'en' = 'pt'): VoucherItemInput => ({
  tempId: crypto.randomUUID(),
  serviceName: '',
  serviceType: SERVICE_TYPES[lang][0],
  paxEntries: [newPax(lang)],
});

const buildEmptyForm = (lang: 'pt' | 'en' = 'pt'): VoucherCreateInput => ({
  companyId: '',
  companyName: '',
  companyLanguage: lang,
  agencyId: '',
  agencyName: '',
  holderName: '',
  serviceDate: '',
  hotel: '',
  pickupTime: '',
  notes: '',
  amountPaid: 0,
  items: [newItem(lang)],
});

export default function VoucherEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [useManualAgency, setUseManualAgency] = useState(false);
  const [form, setForm] = useState<VoucherCreateInput>(buildEmptyForm('pt'));

  const lang = form.companyLanguage || 'pt';

  useEffect(() => {
    CompanyService.getActive().then(setCompanies);
    AgencyService.getActive().then(setAgencies);
  }, []);

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalAmount = form.items.reduce((acc, item) =>
    acc + item.paxEntries.reduce((s, p) => s + p.quantity * p.pricePerPax, 0), 0);
  const remainingBalance = totalAmount - (form.amountPaid || 0);

  const setField = (key: keyof VoucherCreateInput, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // ── Company selection ──────────────────────────────────────────────────────
  const handleCompanyChange = (id: string) => {
    const co = companies.find(c => c.id === id);
    if (!co) {
      setForm(prev => ({ ...prev, companyId: '', companyName: '', companyLanguage: 'pt' }));
      return;
    }
    const newLang = co.language;
    // Re-build items with correct language defaults when company changes
    setForm(prev => ({
      ...prev,
      companyId: co.id,
      companyName: co.name,
      companyLanguage: newLang,
      items: prev.items.map(item => ({
        ...item,
        serviceType: SERVICE_TYPES[newLang][0],
        paxEntries: item.paxEntries.map(p => ({
          ...p,
          paxType: PAX_TYPES[newLang][0],
        })),
      })),
    }));
  };

  // ── Agency selection ───────────────────────────────────────────────────────
  const handleAgencyChange = (id: string) => {
    if (id === '__manual__') {
      setUseManualAgency(true);
      setField('agencyId', '');
      setField('agencyName', '');
      return;
    }
    setUseManualAgency(false);
    const ag = agencies.find(a => a.id === id);
    setField('agencyId', id);
    setField('agencyName', ag?.name || '');
  };

  // ── Item helpers ───────────────────────────────────────────────────────────
  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, newItem(lang)] }));

  const removeItem = (tempId: string) =>
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.tempId !== tempId) }));

  const updateItem = (tempId: string, key: keyof VoucherItemInput, val: any) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.tempId === tempId ? { ...i, [key]: val } : i),
    }));

  // ── PAX helpers ────────────────────────────────────────────────────────────
  const addPax = (itemTempId: string) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.tempId === itemTempId ? { ...i, paxEntries: [...i.paxEntries, newPax(lang)] } : i
      ),
    }));

  const removePax = (itemTempId: string, paxTempId: string) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.tempId === itemTempId
          ? { ...i, paxEntries: i.paxEntries.filter(p => p.tempId !== paxTempId) }
          : i
      ),
    }));

  const updatePax = (itemTempId: string, paxTempId: string, key: keyof VoucherPaxInput, val: any) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.tempId === itemTempId
          ? { ...i, paxEntries: i.paxEntries.map(p => p.tempId === paxTempId ? { ...p, [key]: val } : p) }
          : i
      ),
    }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return toast.error('Selecione a empresa emissora.');
    if (!form.agencyName.trim()) return toast.error('Informe o nome da agência.');
    if (!form.holderName.trim()) return toast.error('Informe o nome do titular.');
    if (form.items.length === 0) return toast.error('Adicione ao menos um serviço.');
    for (const item of form.items) {
      if (!item.serviceName.trim()) return toast.error('Preencha o nome de todos os serviços.');
      if (item.paxEntries.length === 0) return toast.error('Cada serviço precisa ter ao menos um tipo de PAX.');
    }

    setSaving(true);
    try {
      const voucher = await VoucherService.create(form);
      toast.success(`Voucher ${voucher.voucherNumber} criado!`);
      router.push(`/admin/vouchers/${voucher.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar voucher.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const selectedCompany = companies.find(c => c.id === form.companyId);

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Novo Voucher</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha os dados para gerar o voucher de serviços</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Coluna principal ─────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Empresa Emissora */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Briefcase size={18} /> Empresa Emissora do Voucher
            </div>

            <div className="relative">
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white text-gray-800"
                value={form.companyId || ''}
                onChange={e => handleCompanyChange(e.target.value)}
              >
                <option value="">— Selecione a empresa emissora —</option>
                {companies.map(co => (
                  <option key={co.id} value={co.id}>
                    {co.name} {co.language === 'en' ? '🇺🇸' : '🇧🇷'}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Badge idioma */}
            {selectedCompany && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                lang === 'en' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
              }`}>
                <span>{lang === 'en' ? '🇺🇸' : '🇧🇷'}</span>
                <span>
                  {lang === 'en'
                    ? 'PDF generated in English — PAX types and service names will be shown in English'
                    : 'PDF gerado em Português — Tipos de PAX e serviços serão exibidos em PT-BR'}
                </span>
              </div>
            )}
          </div>

          {/* Agência */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Building2 size={18} /> Agência Compradora
            </div>

            {!useManualAgency ? (
              <div>
                <div className="relative">
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white text-gray-800"
                    value={form.agencyId || ''}
                    onChange={e => handleAgencyChange(e.target.value)}
                  >
                    <option value="">— Selecione uma agência —</option>
                    {agencies.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.name}</option>
                    ))}
                    <option value="__manual__">+ Digitar manualmente</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.agencyName}
                  onChange={e => setField('agencyName', e.target.value)}
                  placeholder="Nome da agência"
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => { setUseManualAgency(false); setField('agencyId', ''); setField('agencyName', ''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Usar lista
                </button>
              </div>
            )}
          </div>

          {/* Dados da Reserva */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <User size={18} /> Dados da Reserva
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Titular *</label>
              <input
                type="text"
                value={form.holderName}
                onChange={e => setField('holderName', e.target.value)}
                placeholder="Nome completo do titular da reserva"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <CalendarDays size={13} className="inline mr-1" />Data do Serviço
                </label>
                <input type="date" value={form.serviceDate || ''} onChange={e => setField('serviceDate', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <MapPin size={13} className="inline mr-1" />Hotel / Local de Saída
                </label>
                <input type="text" value={form.hotel || ''} onChange={e => setField('hotel', e.target.value)}
                  placeholder="Nome do hotel" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Clock size={13} className="inline mr-1" />Horário de Saída
                </label>
                <input type="time" value={form.pickupTime || ''} onChange={e => setField('pickupTime', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800" />
              </div>
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <FileText size={18} /> Serviços
              </div>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
                <Plus size={16} /> Adicionar Serviço
              </button>
            </div>

            {form.items.map((item, itemIdx) => {
              const itemTotal = item.paxEntries.reduce((s, p) => s + p.quantity * p.pricePerPax, 0);

              return (
                <div key={item.tempId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Serviço #{itemIdx + 1}</span>
                    <button type="button" onClick={() => removeItem(item.tempId)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Serviço *</label>
                      <input
                        type="text"
                        value={item.serviceName}
                        onChange={e => updateItem(item.tempId, 'serviceName', e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Iguazu Falls — Brazilian Side' : 'Ex: Cataratas do Iguaçu'}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Serviço</label>
                      <div className="relative">
                        <select
                          value={item.serviceType}
                          onChange={e => updateItem(item.tempId, 'serviceType', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white text-gray-800"
                        >
                          {SERVICE_TYPES[lang].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* PAX entries */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600">
                        {lang === 'en' ? 'PAX Types' : 'Tipos de PAX'}
                      </span>
                      <button type="button" onClick={() => addPax(item.tempId)}
                        className="flex items-center gap-1 text-primary font-medium hover:underline">
                        <Plus size={14} /> {lang === 'en' ? 'Add PAX' : 'Adicionar PAX'}
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase px-1">
                      <div className="col-span-5">{lang === 'en' ? 'PAX Type' : 'Tipo de PAX'}</div>
                      <div className="col-span-2 text-center">{lang === 'en' ? 'Qty' : 'Qtd'}</div>
                      <div className="col-span-3 text-right">{lang === 'en' ? 'Price/PAX' : 'Valor/PAX'}</div>
                      <div className="col-span-1 text-right">{lang === 'en' ? 'Subtotal' : 'Sub'}</div>
                      <div className="col-span-1" />
                    </div>

                    {item.paxEntries.map(pax => (
                      <div key={pax.tempId} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <div className="relative">
                            <select
                              value={pax.paxType}
                              onChange={e => updatePax(item.tempId, pax.tempId, 'paxType', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-white text-sm text-gray-800"
                            >
                              {PAX_TYPES[lang].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <input type="number" min={1} value={pax.quantity}
                            onChange={e => updatePax(item.tempId, pax.tempId, 'quantity', Number(e.target.value))}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-center text-sm" />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                            <input type="number" min={0} step="0.01" value={pax.pricePerPax}
                              onChange={e => updatePax(item.tempId, pax.tempId, 'pricePerPax', Number(e.target.value))}
                              className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-right" />
                          </div>
                        </div>
                        <div className="col-span-1 text-right text-sm font-medium text-gray-700">
                          {fmt(pax.quantity * pax.pricePerPax)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removePax(item.tempId, pax.tempId)}
                            className="p-1 text-red-400 hover:text-red-600 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-700">
                        {lang === 'en' ? 'Subtotal:' : 'Subtotal:'} <span className="text-primary">{fmt(itemTotal)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'en' ? 'Notes / Observations' : 'Observações'}
            </label>
            <textarea
              value={form.notes || ''}
              onChange={e => setField('notes', e.target.value)}
              rows={3}
              placeholder={lang === 'en' ? 'Special instructions, additional information...' : 'Informações adicionais, instruções especiais...'}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800 resize-none"
            />
          </div>
        </div>

        {/* ── Sidebar – Resumo financeiro ───────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <DollarSign size={18} /> {lang === 'en' ? 'Financial Summary' : 'Resumo Financeiro'}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{lang === 'en' ? 'Total PAX:' : 'Total de PAX:'}</span>
                <span className="font-semibold">
                  {form.items.reduce((s, i) => s + i.paxEntries.reduce((a, p) => a + p.quantity, 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">
                  {lang === 'en' ? 'Total Services:' : 'Total dos Serviços:'}
                </span>
                <span className="font-bold text-gray-800">{fmt(totalAmount)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {lang === 'en' ? 'Amount Paid' : 'Valor Pago'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <input type="number" min={0} step="0.01" value={form.amountPaid}
                  onChange={e => setField('amountPaid', Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800" />
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              remainingBalance > 0 ? 'bg-orange-50 border border-orange-100' :
              remainingBalance < 0 ? 'bg-red-50 border border-red-100' :
              'bg-green-50 border border-green-100'
            }`}>
              <div className="text-sm text-gray-600 mb-1">
                {lang === 'en' ? 'Remaining Balance' : 'Saldo Restante'}
              </div>
              <div className={`text-2xl font-bold ${
                remainingBalance > 0 ? 'text-orange-600' :
                remainingBalance < 0 ? 'text-red-600' : 'text-green-700'
              }`}>{fmt(remainingBalance)}</div>
              {remainingBalance === 0 && (
                <div className="text-xs text-green-600 mt-1">
                  {lang === 'en' ? 'Payment settled' : 'Pagamento quitado'}
                </div>
              )}
            </div>

            {/* Company preview badge */}
            {selectedCompany && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600">
                <div className="font-semibold text-gray-800 mb-0.5">{selectedCompany.name}</div>
                <div>{selectedCompany.language === 'en' ? '🇺🇸 PDF in English' : '🇧🇷 PDF em Português'}</div>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving
                ? (lang === 'en' ? 'Generating...' : 'Gerando Voucher...')
                : (lang === 'en' ? 'Generate Voucher' : 'Gerar Voucher')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
