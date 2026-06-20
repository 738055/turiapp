'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { DriverGuide } from '@/app/types';
import { Plus, Edit2, Trash2, Save, X, Search, Phone, FileText, Users, Car } from 'lucide-react';
import { Vehicle } from '@/app/types';

const LANGUAGES = [
  { value: 'pt', label: 'Portugues' },
  { value: 'en', label: 'Ingles' },
  { value: 'es', label: 'Espanhol' },
  { value: 'de', label: 'Alemao' },
  { value: 'fr', label: 'Frances' },
  { value: 'it', label: 'Italiano' },
];

const TYPE_CONFIG = {
  guide:  { label: 'Guia',      color: 'bg-purple-100 text-purple-700' },
  driver: { label: 'Motorista', color: 'bg-primary-100 text-primary-700' },
  both:   { label: 'Ambos',     color: 'bg-emerald-100 text-emerald-700' },
};

const TABS = [
  { key: 'all',    label: 'Todos' },
  { key: 'guide',  label: 'Guias' },
  { key: 'driver', label: 'Motoristas' },
  { key: 'both',   label: 'Ambos' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function DriversPage() {
  const supabase = createClientComponentClient();
  const [items, setItems] = useState<DriverGuide[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allLinks, setAllLinks] = useState<{ vehicle_id: string; driver_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [formData, setFormData] = useState<Partial<DriverGuide>>({
    name: '',
    phone: '',
    type: 'guide',
    document_number: '',
    languages_spoken: [],
    notes: '',
    status: 'active',
  });

  const getVehiclesForDriver = (driverId: string) => {
    const vehicleIds = allLinks.filter(l => l.driver_id === driverId).map(l => l.vehicle_id);
    return vehicles.filter(v => vehicleIds.includes(v.id));
  };

  const fetchItems = async () => {
    setLoading(true);
    const [{ data, error }, { data: v }, { data: links }] = await Promise.all([
      supabase.from('drivers_guides').select('*').order('name'),
      supabase.from('vehicles').select('*').eq('status', 'active').order('model'),
      supabase.from('vehicle_driver_links').select('vehicle_id, driver_id'),
    ]);

    if (error) {
      console.error('Erro ao buscar motoristas/guias:', error);
    } else {
      setItems((data ?? []) as DriverGuide[]);
    }
    if (v) setVehicles(v as Vehicle[]);
    if (links) setAllLinks(links);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Nome e obrigatorio');

    const payload = {
      name: formData.name,
      phone: formData.phone || null,
      type: formData.type,
      document_number: formData.document_number || null,
      languages_spoken: formData.languages_spoken ?? [],
      notes: formData.notes || null,
      status: formData.status,
    };

    if (formData.id) {
      const { error } = await supabase.from('drivers_guides').update(payload).eq('id', formData.id);
      if (error) return alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('drivers_guides').insert([payload]);
      if (error) return alert('Erro ao criar: ' + error.message);
    }

    setIsEditing(false);
    setFormData({ name: '', type: 'guide', languages_spoken: [], status: 'active' });
    fetchItems();
  };

  const handleEdit = (item: DriverGuide) => {
    setFormData({ ...item });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const { error } = await supabase.from('drivers_guides').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchItems();
  };

  const toggleLanguage = (lang: string) => {
    const current = formData.languages_spoken ?? [];
    if (current.includes(lang)) {
      setFormData({ ...formData, languages_spoken: current.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages_spoken: [...current, lang] });
    }
  };

  const getLangLabel = (code: string) => LANGUAGES.find(l => l.value === code)?.label ?? code;

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Motoristas & Guias</h1>
          <p className="text-sm text-gray-500">Gerencie motoristas, guias turisticos e profissionais.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', type: 'guide', languages_spoken: [], status: 'active', phone: '', document_number: '', notes: '' });
            setIsEditing(true);
          }}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Cadastro
        </button>
      </div>

      {/* Modal / Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                {formData.id ? 'Editar Cadastro' : 'Novo Cadastro'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Ex: Carlos da Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 pl-10"
                      placeholder="+55 45 99999-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Documento (RG/DNI)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={formData.document_number || ''}
                      onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 pl-10"
                      placeholder="00.000.000-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as DriverGuide['type'] })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="guide">Guia Turistico</option>
                  <option value="driver">Motorista</option>
                  <option value="both">Motorista + Guia</option>
                </select>
              </div>

              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <label className="block text-xs font-bold text-gray-600 mb-3 uppercase">Idiomas Falados</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => {
                    const checked = (formData.languages_spoken ?? []).includes(lang.value);
                    return (
                      <label
                        key={lang.value}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                          checked ? 'bg-white border-primary shadow-sm' : 'border-transparent hover:bg-primary-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLanguage(lang.value)}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{lang.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observacoes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 h-20 resize-none focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Informacoes adicionais, disponibilidade, etc."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="driverStatus"
                  checked={formData.status === 'active'}
                  onChange={e => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-5 h-5 text-primary rounded"
                />
                <label htmlFor="driverStatus" className="text-gray-700 font-medium cursor-pointer">Cadastro Ativo</label>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                <Save size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-800 border-b border-gray-200 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Idiomas</th>
                <th className="px-6 py-4">Veiculos</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{item.name}</div>
                    {item.document_number && (
                      <div className="text-xs text-gray-400 mt-0.5">Doc: {item.document_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.phone ? (
                      <span className="flex items-center gap-1.5"><Phone size={12} /> {item.phone}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_CONFIG[item.type].color}`}>
                      {TYPE_CONFIG[item.type].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(item.languages_spoken ?? []).length > 0 ? (
                        item.languages_spoken.map(lang => (
                          <span key={lang} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            {getLangLabel(lang)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 text-xs">Nenhum</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const driverVehicles = getVehiclesForDriver(item.id);
                      return driverVehicles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {driverVehicles.map(v => (
                            <span key={v.id} className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Car size={10} /> {v.model} <span className="font-mono text-[10px]">({v.plate})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Nenhum</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                    }`}>
                      {item.status === 'active' ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum motorista ou guia encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
