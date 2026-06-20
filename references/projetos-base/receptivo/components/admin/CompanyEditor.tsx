'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyService } from '@/services/companyService';
import { Company } from '@/types';
import { Save, ArrowLeft, Loader2, Globe } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

interface Props {
  initialData?: Company;
  isEditMode?: boolean;
}

const EMPTY: Omit<Company, 'id' | 'createdAt'> = {
  name: '',
  cnpj: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  city: 'Foz do Iguaçu',
  state: 'PR',
  logoUrl: '',
  language: 'pt',
  primaryColor: '#0A6640',
  isActive: true,
};

export default function CompanyEditor({ initialData, isEditMode = false }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Company, 'id' | 'createdAt'>>(
    initialData
      ? {
          name: initialData.name,
          cnpj: initialData.cnpj || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          whatsapp: initialData.whatsapp || '',
          address: initialData.address || '',
          city: initialData.city || 'Foz do Iguaçu',
          state: initialData.state || 'PR',
          logoUrl: initialData.logoUrl || '',
          language: initialData.language || 'pt',
          primaryColor: initialData.primaryColor || '#0A6640',
          isActive: initialData.isActive,
        }
      : EMPTY
  );

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nome da empresa é obrigatório.');
    setSaving(true);
    try {
      if (isEditMode && initialData) {
        await CompanyService.update(initialData.id, form);
        toast.success('Empresa atualizada!');
      } else {
        await CompanyService.create(form);
        toast.success('Empresa criada!');
      }
      router.push('/admin/companies');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(form[key] as string) || ''}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Editar Empresa' : 'Nova Empresa Emissora'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Empresa que emite os vouchers (aparece no cabeçalho do PDF)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Identidade */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Identidade da Empresa</div>
          {field('Nome da Empresa *', 'name', 'text', 'Ex: Trip To Iguazu Falls')}
          {field('CNPJ', 'cnpj', 'text', '00.000.000/0001-00')}

          {/* Idioma do voucher */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Globe size={14} className="inline mr-1" />Idioma do Voucher PDF
            </label>
            <div className="flex gap-3">
              {(['pt', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => set('language', lang)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold text-sm transition-colors ${
                    form.language === lang
                      ? 'border-primary bg-green-50 text-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {lang === 'pt' ? '🇧🇷 Português' : '🇺🇸 English'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.language === 'pt'
                ? 'O PDF será gerado em Português com todos os rótulos em PT-BR.'
                : 'The PDF will be generated in English with all labels in English.'}
            </p>
          </div>

          {/* Cor primária */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cor Principal (cabeçalho do voucher)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor || '#0A6640'}
                onChange={e => set('primaryColor', e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
              />
              <input
                type="text"
                value={form.primaryColor || '#0A6640'}
                onChange={e => set('primaryColor', e.target.value)}
                placeholder="#0A6640"
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800 font-mono"
              />
            </div>
          </div>

          {field('URL do Logo (opcional)', 'logoUrl', 'text', 'https://... ou /logo.png')}
        </div>

        {/* Contato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Contato (aparece no rodapé do voucher)</div>
          <div className="grid grid-cols-2 gap-4">
            {field('Telefone', 'phone', 'tel', '(45) 99108-3852')}
            {field('WhatsApp', 'whatsapp', 'tel', '(45) 99108-3852')}
          </div>
          {field('E-mail', 'email', 'email', 'contato@empresa.com')}
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Endereço</div>
          {field('Endereço', 'address', 'text', 'Rua, número, bairro')}
          <div className="grid grid-cols-2 gap-4">
            {field('Cidade', 'city', 'text', 'Foz do Iguaçu')}
            {field('Estado', 'state', 'text', 'PR')}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Empresa Ativa</span>
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Empresa'}
          </Button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
