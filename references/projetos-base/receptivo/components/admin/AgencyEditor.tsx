'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgencyService } from '@/services/agencyService';
import { Agency } from '@/types';
import { Save, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

interface Props {
  initialData?: Agency;
  isEditMode?: boolean;
}

const EMPTY: Omit<Agency, 'id' | 'createdAt'> = {
  name: '',
  cnpj: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  city: 'Foz do Iguaçu',
  state: 'PR',
  contactPerson: '',
  isActive: true,
  notes: '',
};

export default function AgencyEditor({ initialData, isEditMode = false }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Agency, 'id' | 'createdAt'>>(
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
          contactPerson: initialData.contactPerson || '',
          isActive: initialData.isActive,
          notes: initialData.notes || '',
        }
      : EMPTY
  );

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nome da agência é obrigatório.');
    setSaving(true);
    try {
      if (isEditMode && initialData) {
        await AgencyService.update(initialData.id, form);
        toast.success('Agência atualizada!');
      } else {
        await AgencyService.create(form);
        toast.success('Agência criada!');
      }
      router.push('/admin/agencies');
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
            {isEditMode ? 'Editar Agência' : 'Nova Agência'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Dados do parceiro / agência compradora</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Dados principais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <Building2 size={18} /> Dados da Agência
          </div>
          {field('Nome da Agência *', 'name', 'text', 'Ex: Turismo Iguaçu Ltda')}
          <div className="grid grid-cols-2 gap-4">
            {field('CNPJ', 'cnpj', 'text', '00.000.000/0001-00')}
            {field('Pessoa de Contato', 'contactPerson', 'text', 'Nome do responsável')}
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Contato</div>
          <div className="grid grid-cols-2 gap-4">
            {field('Telefone', 'phone', 'tel', '(45) 3333-0000')}
            {field('WhatsApp', 'whatsapp', 'tel', '(45) 99999-0000')}
          </div>
          {field('E-mail', 'email', 'email', 'agencia@email.com')}
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

        {/* Observações e Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="font-semibold text-gray-700 mb-2">Configurações</div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
            <textarea
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre a agência..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800 resize-none"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Agência Ativa</span>
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Agência'}
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
