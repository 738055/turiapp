'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { Vehicle, DriverGuide } from '@/app/types';
import { Plus, Edit2, Trash2, Save, X, Search, Truck, UserCheck } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'maintenance';

const STATUS_LABELS: Record<Vehicle['status'], string> = {
  active: 'Ativo',
  maintenance: 'Manutencao',
  inactive: 'Inativo',
};

const STATUS_BADGE: Record<Vehicle['status'], string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-amber-100 text-amber-700',
  inactive: 'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  guide: 'Guia',
  driver: 'Motorista',
  both: 'Ambos',
};

const EMPTY_FORM: Partial<Vehicle> = {
  plate: '',
  model: '',
  capacity: 4,
  status: 'active',
  notes: '',
};

export default function VehiclesPage() {
  const supabase = createClientComponentClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formData, setFormData] = useState<Partial<Vehicle>>(EMPTY_FORM);

  // Vínculos: vehicle_id -> driver_ids
  const [allLinks, setAllLinks] = useState<{ vehicle_id: string; driver_id: string }[]>([]);
  const [formDriverIds, setFormDriverIds] = useState<string[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: v }, { data: d }, { data: links }] = await Promise.all([
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('drivers_guides').select('*').eq('status', 'active').order('name'),
      supabase.from('vehicle_driver_links').select('vehicle_id, driver_id'),
    ]);
    if (v) setVehicles(v as Vehicle[]);
    if (d) setDrivers(d as DriverGuide[]);
    if (links) setAllLinks(links);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getDriversForVehicle = (vehicleId: string) => {
    const driverIds = allLinks.filter(l => l.vehicle_id === vehicleId).map(l => l.driver_id);
    return drivers.filter(d => driverIds.includes(d.id));
  };

  const handleSave = async () => {
    if (!formData.plate || !formData.model) return alert('Preencha Placa e Modelo.');

    const payload = {
      plate: formData.plate.toUpperCase().trim(),
      model: formData.model.trim(),
      name: formData.model.trim(),
      capacity: formData.capacity ?? 4,
      status: formData.status ?? 'active',
      notes: formData.notes || null,
    };

    try {
      let vehicleId = formData.id;

      if (vehicleId) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicleId);
        if (error) throw error;
      } else {
        const { data: newV, error } = await supabase.from('vehicles').insert(payload).select().single();
        if (error) throw error;
        vehicleId = newV.id;
      }

      // Sync driver links
      await supabase.from('vehicle_driver_links').delete().eq('vehicle_id', vehicleId);
      if (formDriverIds.length > 0) {
        const linkPayload = formDriverIds.map(dId => ({ vehicle_id: vehicleId, driver_id: dId }));
        const { error } = await supabase.from('vehicle_driver_links').insert(linkPayload);
        if (error) throw error;
      }

      setIsEditing(false);
      setFormData(EMPTY_FORM);
      setFormDriverIds([]);
      fetchAll();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veiculo?')) return;
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      fetchAll();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const openEdit = (vehicle: Vehicle) => {
    setFormData({ ...vehicle });
    const linkedIds = allLinks.filter(l => l.vehicle_id === vehicle.id).map(l => l.driver_id);
    setFormDriverIds(linkedIds);
    setIsEditing(true);
  };

  const openNew = () => {
    setFormData({ ...EMPTY_FORM });
    setFormDriverIds([]);
    setIsEditing(true);
  };

  const toggleDriver = (driverId: string) => {
    setFormDriverIds(prev =>
      prev.includes(driverId) ? prev.filter(id => id !== driverId) : [...prev, driverId]
    );
  };

  const filtered = vehicles.filter(v => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Ativos' },
    { key: 'maintenance', label: 'Manutencao' },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Veiculos</h1>
          <p className="text-sm text-gray-500">Gerencie a frota e vincule motoristas/guias a cada veiculo.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Veiculo
        </button>
      </div>

      {/* Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Truck size={20} className="text-primary" />
                {formData.id ? 'Editar Veiculo' : 'Novo Veiculo'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Placa *</label>
                  <input
                    type="text"
                    value={formData.plate || ''}
                    onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 font-mono uppercase font-bold text-primary focus:ring-2 focus:ring-primary outline-none"
                    placeholder="ABC-1D23"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Sprinter 415"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Capacidade (pax)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity ?? 4}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="maintenance">Manutencao</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Motoristas/Guias vinculados */}
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <label className="block text-xs font-bold text-primary-700 mb-3 uppercase flex items-center gap-1">
                  <UserCheck size={14} /> Motoristas / Guias vinculados
                </label>
                {drivers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                    {drivers.map(d => {
                      const checked = formDriverIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                            checked ? 'bg-white border-primary-400 shadow-sm' : 'border-transparent hover:bg-primary-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDriver(d.id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700 flex-1">{d.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{TYPE_LABELS[d.type] || d.type}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum motorista/guia cadastrado.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observacoes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Informacoes adicionais sobre o veiculo..."
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm"
              >
                <Save size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa ou modelo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === tab.key
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
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4 text-center">Capacidade</th>
                <th className="px-6 py-4">Motoristas / Guias</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map(v => {
                  const linkedDrivers = getDriversForVehicle(v.id);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-primary bg-primary-50 px-2 py-1 rounded">
                          {v.plate}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {v.model}
                        {v.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{v.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{v.capacity} pax</td>
                      <td className="px-6 py-4">
                        {linkedDrivers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedDrivers.map(d => (
                              <span key={d.id} className="text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded">
                                {d.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Nenhum vinculado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_BADGE[v.status]}`}>
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(v)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Nenhum veiculo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
