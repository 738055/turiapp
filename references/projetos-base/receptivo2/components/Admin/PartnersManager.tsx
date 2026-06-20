'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { Plus, Trash2, Edit2, UploadCloud, X, Loader2 } from 'lucide-react';

export default function PartnersManager() {
  const supabase = createClientComponentClient();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `partner-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('general').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('general').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPartner.id) {
        await supabase.from('partners').update({ name: editingPartner.name, logo_url: editingPartner.logo_url, is_active: editingPartner.is_active }).eq('id', editingPartner.id);
      } else {
        await supabase.from('partners').insert([{ name: editingPartner.name, logo_url: editingPartner.logo_url, is_active: editingPartner.is_active }]);
      }
      await fetchPartners();
      setEditingPartner(null);
    } catch (error) {
      alert('Erro ao salvar parceiro.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este parceiro do site?')) return;
    await supabase.from('partners').delete().eq('id', id);
    setPartners(partners.filter(p => p.id !== id));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
         <div>
            <h3 className="font-bold text-gray-800">Carrossel de Parceiros</h3>
            <p className="text-sm text-gray-500">Faça o upload de logos (fundo transparente) para aparecerem na Home.</p>
         </div>
         <button onClick={() => setEditingPartner({ name: '', logo_url: '', is_active: true })} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Plus size={18}/> Novo Parceiro
         </button>
      </div>

      {editingPartner && (
         <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-200 relative animate-fadeIn">
            <button onClick={() => setEditingPartner(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
            <h4 className="font-bold mb-4 text-lg">{editingPartner.id ? 'Editar' : 'Adicionar'} Parceiro</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-primary-50 p-4 rounded-lg border border-dashed border-primary-300 text-center">
                  <UploadCloud className="mx-auto text-primary-500 mb-2" size={32} />
                  <p className="text-sm font-bold text-primary-800 mb-2">Upload do Logo (PNG Transparente)</p>
                  <input type="file" accept="image/png, image/webp" onChange={async (e) => {
                     if (!e.target.files?.length) return;
                     try {
                        setSaving(true);
                        const url = await handleFileUpload(e.target.files[0]);
                        setEditingPartner({ ...editingPartner, logo_url: url });
                     } catch(err) { alert('Erro no upload'); } finally { setSaving(false); }
                  }} className="text-xs text-primary-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer" />
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa</label>
                     <input type="text" className="w-full border rounded p-2" placeholder="Ex: Macuco Safari" value={editingPartner.name} onChange={e => setEditingPartner({...editingPartner, name: e.target.value})} />
                  </div>
                  {editingPartner.logo_url && (
                     <div className="bg-gray-100 p-2 rounded flex items-center justify-center h-20 border border-gray-200">
                        <img src={editingPartner.logo_url} className="max-h-16 object-contain" />
                     </div>
                  )}
               </div>
            </div>
            
            <div className="mt-6 flex justify-end">
               <button disabled={saving} onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                  {saving ? 'Salvando...' : 'Salvar Parceiro'}
               </button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
         {partners.map(partner => (
            <div key={partner.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center relative group h-32 hover:shadow-md transition-shadow">
               <img src={partner.logo_url} alt={partner.name} className="max-h-16 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
               <p className="text-[10px] font-bold text-gray-500 mt-2 truncate w-full text-center">{partner.name}</p>
               
               <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                  <button onClick={() => setEditingPartner(partner)} className="p-2 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors" title="Editar"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(partner.id)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors" title="Deletar"><Trash2 size={16}/></button>
               </div>
            </div>
         ))}
         
         {/* Aviso de lista vazia */}
         {partners.length === 0 && !editingPartner && (
            <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
               Nenhum parceiro cadastrado. As logos dos seus fornecedores e parceiros aparecerão aqui. Clique em <b>"Novo Parceiro"</b>.
            </div>
         )}
      </div>
    </div>
  );
}
