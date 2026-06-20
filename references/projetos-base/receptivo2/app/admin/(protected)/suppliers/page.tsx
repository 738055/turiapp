'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/app/types';
import { Plus, Edit2, Trash2, Save, X, Phone, Mail, Building2, Search } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    phone: '',
    pixKey: '',
    bankDetails: '',
    active: true
  });

  // Busca Fornecedores
  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } else {
      // Mapeamento simples pois os nomes das colunas batem com a interface (exceto snake_case se houver)
      const formatted: Supplier[] = data.map((s: any) => ({
         id: s.id,
         name: s.name,
         email: s.email,
         phone: s.phone,
         pixKey: s.pix_key,
         bankDetails: s.bank_details,
         active: s.active
      }));
      setSuppliers(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Salvar (Criar ou Editar)
  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');

    const payload = {
       name: formData.name,
       email: formData.email,
       phone: formData.phone,
       pix_key: formData.pixKey,
       bank_details: formData.bankDetails,
       active: formData.active
    };

    if (formData.id) {
       // Update
       const { error } = await supabase.from('suppliers').update(payload).eq('id', formData.id);
       if (error) alert('Erro ao atualizar');
    } else {
       // Insert
       const { error } = await supabase.from('suppliers').insert([payload]);
       if (error) alert('Erro ao criar');
    }

    setIsEditing(false);
    setFormData({ name: '', active: true });
    fetchSuppliers();
  };

  const handleEdit = (supplier: Supplier) => {
     setFormData(supplier);
     setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
     if (!confirm('Tem certeza? Isso pode afetar produtos vinculados.')) return;
     const { error } = await supabase.from('suppliers').delete().eq('id', id);
     if (error) alert('Erro ao excluir. Verifique se há produtos vinculados.');
     else fetchSuppliers();
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Fornecedores & Parceiros</h1>
            <p className="text-sm text-gray-500">Gerencie empresas de transporte, hotéis e guias.</p>
         </div>
         <button 
           onClick={() => { setFormData({ active: true }); setIsEditing(true); }}
           className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
         >
            <Plus size={20}/> Novo Fornecedor
         </button>
      </div>

      {/* Modal / Form Overlay */}
      {isEditing && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">{formData.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                  <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa / Parceiro *</label>
                     <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Ex: Viação Cataratas"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input 
                           type="email" 
                           value={formData.email || ''} 
                           onChange={e => setFormData({...formData, email: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                        <input 
                           type="tel" 
                           value={formData.phone || ''} 
                           onChange={e => setFormData({...formData, phone: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                     </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                     <h4 className="font-bold text-sm text-yellow-800 mb-2 flex items-center gap-2"><Building2 size={16}/> Dados Bancários</h4>
                     <div className="space-y-3">
                        <div>
                           <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Chave PIX</label>
                           <input 
                              type="text" 
                              value={formData.pixKey || ''} 
                              onChange={e => setFormData({...formData, pixKey: e.target.value})}
                              className="w-full border border-gray-300 rounded bg-white p-2 text-sm"
                              placeholder="CPF, CNPJ, Email ou Aleatória"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Outros Detalhes (Banco, Ag, CC)</label>
                           <textarea 
                              value={formData.bankDetails || ''} 
                              onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                              className="w-full border border-gray-300 rounded bg-white p-2 text-sm h-20 resize-none"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({...formData, active: e.target.checked})}
                        className="w-5 h-5 text-primary rounded"
                     />
                     <label htmlFor="active" className="text-gray-700 font-medium">Fornecedor Ativo</label>
                  </div>
               </div>

               <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-success text-white font-bold rounded-lg hover:bg-success-dark flex items-center gap-2 shadow-sm">
                     <Save size={18}/> Salvar
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
               <input 
                  type="text" 
                  placeholder="Buscar fornecedor..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
               />
            </div>
         </div>

         {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
         ) : (
            <table className="w-full text-left text-sm">
               <thead className="bg-white text-gray-800 border-b border-gray-200 uppercase text-xs font-bold">
                  <tr>
                     <th className="px-6 py-4">Nome</th>
                     <th className="px-6 py-4">Contato</th>
                     <th className="px-6 py-4">Pagamento (PIX)</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filtered.length > 0 ? filtered.map(item => (
                     <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                           <div className="flex flex-col gap-1">
                              {item.email && <span className="flex items-center gap-1.5"><Mail size={12}/> {item.email}</span>}
                              {item.phone && <span className="flex items-center gap-1.5"><Phone size={12}/> {item.phone}</span>}
                              {!item.email && !item.phone && <span className="text-gray-400 italic">Sem contato</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600">
                           {item.pixKey || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${item.active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                              {item.active ? 'ATIVO' : 'INATIVO'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleEdit(item)} className="p-2 text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum fornecedor encontrado.</td></tr>
                  )}
               </tbody>
            </table>
         )}
      </div>
    </>
  );
}