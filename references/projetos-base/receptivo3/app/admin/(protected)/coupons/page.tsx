'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon } from '@/app/types';
import { Plus, Edit2, Trash2, Save, X, Search, Tag, Percent, DollarSign, Calendar } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxUses: 0, // 0 = Ilimitado no form visual
    expirationDate: '',
    active: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map((c: any) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        minPurchaseAmount: c.min_purchase_amount,
        maxUses: c.max_uses,
        usedCount: c.used_count,
        expirationDate: c.expiration_date,
        active: c.active
      }));
      setCoupons(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    if (!formData.code || !formData.discountValue) return alert('Preencha os campos obrigatórios');

    const payload = {
       code: formData.code.toUpperCase().replace(/\s/g, ''),
       description: formData.description,
       discount_type: formData.discountType,
       discount_value: formData.discountValue,
       min_purchase_amount: formData.minPurchaseAmount,
       max_uses: formData.maxUses === 0 ? null : formData.maxUses,
       expiration_date: formData.expirationDate || null,
       active: formData.active
    };

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: formData.id ? 'update' : 'insert', 
          payload, 
          id: formData.id 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setIsEditing(false);
      setFormData({ active: true, discountType: 'percentage' });
      fetchCoupons();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
     if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
     try {
       await fetch('/api/admin/coupons', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'delete', id })
       });
       fetchCoupons();
     } catch (error) {
       alert('Erro ao excluir cupom.');
     }
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Cupons de Desconto</h1>
            <p className="text-sm text-gray-500">Crie campanhas promocionais para aumentar vendas.</p>
         </div>
         <button 
           onClick={() => { 
             setFormData({ 
               code: '', discountType: 'percentage', discountValue: 0, 
               minPurchaseAmount: 0, maxUses: 0, active: true 
             }); 
             setIsEditing(true); 
           }}
           className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
         >
            <Plus size={20}/> Novo Cupom
         </button>
      </div>

      {/* Modal / Form */}
      {isEditing && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                     <Tag size={20} className="text-primary"/> 
                     {formData.id ? 'Editar Cupom' : 'Novo Cupom'}
                  </h3>
                  <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Código do Cupom *</label>
                        <input 
                           type="text" 
                           value={formData.code} 
                           onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                           className="w-full border border-gray-300 rounded-lg p-2.5 font-mono uppercase font-bold text-primary focus:ring-2 focus:ring-primary outline-none"
                           placeholder="EX: VERAO10"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descrição (Interna)</label>
                        <input 
                           type="text" 
                           value={formData.description || ''} 
                           onChange={e => setFormData({...formData, description: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg p-2.5"
                           placeholder="Campanha Instagram"
                        />
                     </div>
                  </div>
                  
                  <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Tipo de Desconto</label>
                        <select 
                           value={formData.discountType}
                           onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                           className="w-full border border-gray-300 rounded p-2 bg-white"
                        >
                           <option value="percentage">Porcentagem (%)</option>
                           <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Valor do Desconto</label>
                        <div className="relative">
                           <input 
                              type="number" 
                              value={formData.discountValue} 
                              onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})}
                              className="w-full border border-gray-300 rounded p-2 pl-8 font-bold text-gray-800"
                           />
                           <div className="absolute left-2 top-2.5 text-gray-500">
                              {formData.discountType === 'percentage' ? <Percent size={16}/> : <DollarSign size={16}/>}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mínimo de Compra (R$)</label>
                        <input 
                           type="number" 
                           value={formData.minPurchaseAmount} 
                           onChange={e => setFormData({...formData, minPurchaseAmount: parseFloat(e.target.value)})}
                           className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Limite de Usos</label>
                        <input 
                           type="number" 
                           value={formData.maxUses} 
                           onChange={e => setFormData({...formData, maxUses: parseInt(e.target.value)})}
                           className="w-full border border-gray-300 rounded-lg p-2.5"
                           placeholder="0 = Ilimitado"
                        />
                        <span className="text-[10px] text-gray-500">0 para ilimitado</span>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Data de Expiração</label>
                     <input 
                        type="datetime-local" 
                        value={formData.expirationDate ? new Date(formData.expirationDate).toISOString().slice(0, 16) : ''}
                        onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5"
                     />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                     <input 
                        type="checkbox" 
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({...formData, active: e.target.checked})}
                        className="w-5 h-5 text-primary rounded"
                     />
                     <label htmlFor="active" className="text-gray-700 font-medium cursor-pointer">Cupom Ativo</label>
                  </div>
               </div>

               <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                     <Save size={18}/> Salvar Cupom
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
                  placeholder="Buscar cupom..." 
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
                     <th className="px-6 py-4">Código</th>
                     <th className="px-6 py-4">Desconto</th>
                     <th className="px-6 py-4">Uso / Limite</th>
                     <th className="px-6 py-4">Validade</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filtered.length > 0 ? filtered.map(c => (
                     <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <span className="font-mono font-bold text-primary bg-primary-50 px-2 py-1 rounded">{c.code}</span>
                           {c.description && <div className="text-xs text-gray-500 mt-1">{c.description}</div>}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                           {c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${c.discountValue.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                           {c.usedCount} <span className="text-gray-400">/ {c.maxUses || '∞'}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                           {c.expirationDate ? new Date(c.expirationDate).toLocaleDateString('pt-BR') : 'Sem validade'}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                              {c.active ? 'ATIVO' : 'INATIVO'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => { setFormData({...c, discountType: c.discountType as any}); setIsEditing(true); }} className="p-2 text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum cupom encontrado.</td></tr>
                  )}
               </tbody>
            </table>
         )}
      </div>
    </>
  );
}