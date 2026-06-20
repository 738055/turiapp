'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, AvailabilitySlot } from '@/app/types';
import { ChevronLeft, ChevronRight, Lock, Unlock, Users, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';

// Tipagem local para unir o Slot do banco com a lógica visual
interface DayStatus {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  totalSlots: number;
  usedSlots: number;
  available: number;
  hasOverride: boolean; // Se existe registro na tabela availability (exceção)
  dbId?: string; // ID da linha na tabela availability se existir
}

export default function AvailabilityPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Controle do Calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<DayStatus[]>([]);
  
  // Modal de Edição
  const [editingDay, setEditingDay] = useState<DayStatus | null>(null);
  const [editForm, setEditForm] = useState({ totalSlots: 0, isBlocked: false });

  // 1. Carregar Produtos ao iniciar
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('availability', true) // Apenas produtos ativos
        .order('title'); // Lembre-se: no banco é title, no front mapeamos para name

      if (data) {
        const formatted = data.map((p: any) => ({
           id: p.id,
           name: p.title,
           capacityPerSlot: p.capacity_per_slot || 0, // Capacidade Padrão
           isFixedTime: p.is_fixed_time
        })) as Product[];
        setProducts(formatted);
        if (formatted.length > 0) setSelectedProduct(formatted[0]);
      }
    };
    fetchProducts();
  }, []);

  // 2. Carregar Disponibilidade quando muda o Produto ou o Mês
  useEffect(() => {
    if (!selectedProduct) return;
    fetchAvailabilityForMonth();
  }, [selectedProduct, currentDate]);

  const fetchAvailabilityForMonth = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-index
    
    // Intervalo do mês
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Busca exceções/ocupações na tabela availability
    const { data: slots } = await supabase
      .from('availability')
      .select('*')
      .eq('product_id', selectedProduct.id)
      .gte('date', startDate)
      .lte('date', endDate);

    // Gera o grid de dias
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tempDays: DayStatus[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayString = new Date(year, month, d).toISOString().split('T')[0]; // YYYY-MM-DD
      const slot = slots?.find((s: any) => s.date === dayString);

      // LÓGICA CORE DO ERP:
      // Se existe slot no banco, usa ele (exceção ou ocupação registrada).
      // Se NÃO existe, usa o padrão do produto (capacidade padrão, 0 usados, desbloqueado).
      
      if (slot) {
        tempDays.push({
          date: dayString,
          isBlocked: slot.blocked,
          totalSlots: slot.total_slots,
          usedSlots: slot.used_slots,
          available: slot.blocked ? 0 : (slot.total_slots - slot.used_slots),
          hasOverride: true,
          dbId: slot.id
        });
      } else {
        const defaultCap = selectedProduct.capacityPerSlot || 0;
        tempDays.push({
          date: dayString,
          isBlocked: false,
          totalSlots: defaultCap,
          usedSlots: 0,
          available: defaultCap,
          hasOverride: false
        });
      }
    }

    setMonthData(tempDays);
    setLoading(false);
  };

  // 3. Salvar Alterações (Modal)
  const handleSaveDay = async () => {
    if (!editingDay || !selectedProduct) return;

    // Payload para o banco
    const payload = {
       product_id: selectedProduct.id,
       date: editingDay.date,
       total_slots: editForm.totalSlots,
       blocked: editForm.isBlocked,
       // Mantém used_slots se já existir, senão 0
       used_slots: editingDay.usedSlots 
    };

    // Upsert: Atualiza se existir (pela constraint unique product+date), insere se não.
    // Precisamos garantir que a tabela availability tenha constraint UNIQUE(product_id, date)
    const { error } = await supabase
      .from('availability')
      .upsert(payload, { onConflict: 'product_id, date' });

    if (error) {
       console.error(error);
       alert('Erro ao atualizar disponibilidade.');
    } else {
       setEditingDay(null);
       fetchAvailabilityForMonth(); // Recarrega visual
    }
  };

  // Helpers de Calendário
  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getDayColor = (day: DayStatus) => {
    if (day.isBlocked) return 'bg-red-50 border-red-200 text-red-800'; // Bloqueado
    if (day.usedSlots >= day.totalSlots && day.totalSlots > 0) return 'bg-orange-50 border-orange-200 text-orange-800'; // Lotado
    if (day.usedSlots > 0) return 'bg-primary-50 border-primary-200 text-primary-800'; // Vendendo
    return 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'; // Livre / Padrão
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Controle de Disponibilidade</h1>
            <p className="text-sm text-gray-500">Gerencie vagas, bloqueios e capacidade por dia.</p>
         </div>
         
         {/* Seletor de Produto */}
         <div className="w-full md:w-80">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produto Selecionado</label>
            <select 
               className="w-full p-2 border border-gray-300 rounded-lg font-bold text-gray-800 shadow-sm"
               onChange={(e) => {
                  const prod = products.find(p => p.id === e.target.value);
                  setSelectedProduct(prod || null);
               }}
               value={selectedProduct?.id || ''}
            >
               {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
               ))}
            </select>
         </div>
      </div>

      {selectedProduct ? (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
            {/* Calendar Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
               <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"><ChevronLeft size={20}/></button>
               <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
               </h2>
               <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"><ChevronRight size={20}/></button>
            </div>

            {/* Labels Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-gray-200">
               {weekDays.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                     {d}
                  </div>
               ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 bg-gray-200 gap-px min-h-[400px]">
               {/* Espaços vazios antes do dia 1 */}
               {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50/30 min-h-[100px]"></div>
               ))}

               {/* Dias do Mês */}
               {loading ? (
                  <div className="col-span-7 flex items-center justify-center h-64 bg-white">
                     <span className="animate-pulse font-bold text-gray-400">Carregando mapa de vagas...</span>
                  </div>
               ) : monthData.map((day) => (
                  <div 
                     key={day.date} 
                     onClick={() => {
                        setEditingDay(day);
                        setEditForm({ totalSlots: day.totalSlots, isBlocked: day.isBlocked });
                     }}
                     className={`relative min-h-[100px] p-2 cursor-pointer transition-colors group border-b border-r border-transparent ${getDayColor(day)}`}
                  >
                     <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${day.isBlocked ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                           {new Date(day.date).getDate()}
                        </span>
                        {day.hasOverride && (
                           <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded font-bold" title="Configuração Manual">
                              EDIT
                           </span>
                        )}
                     </div>

                     <div className="mt-3 flex flex-col gap-1 items-center justify-center text-center">
                        {day.isBlocked ? (
                           <div className="text-red-500 font-bold text-xs flex items-center gap-1 uppercase mt-2">
                              <Lock size={12}/> Bloqueado
                           </div>
                        ) : (
                           <>
                              <div className="text-xs text-gray-500 font-medium uppercase">Vagas</div>
                              <div className={`font-black text-lg leading-none ${day.available === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                 {day.available}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                 de {day.totalSlots} totais
                              </div>
                              
                              {day.usedSlots > 0 && (
                                 <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                       className="bg-primary-500 h-full" 
                                       style={{ width: `${Math.min(100, (day.usedSlots / day.totalSlots) * 100)}%` }}
                                    ></div>
                                 </div>
                              )}
                           </>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      ) : (
         <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
            <h3 className="text-lg font-bold text-gray-600">Nenhum produto selecionado</h3>
            <p className="text-gray-400">Selecione um produto acima para gerenciar sua disponibilidade.</p>
         </div>
      )}

      {/* Modal de Edição */}
      {editingDay && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
               <div className="bg-primary p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2">
                     <Users size={20}/> 
                     Gerenciar Dia {new Date(editingDay.date).toLocaleDateString('pt-BR')}
                  </h3>
                  <button onClick={() => setEditingDay(null)} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
               </div>
               
               <div className="p-6 space-y-6">
                  {/* Status Atual */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                     <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Já Vendidos:</span>
                        <span className="font-bold text-gray-800">{editingDay.usedSlots} pax</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Capacidade Padrão:</span>
                        <span className="font-bold text-gray-800">{selectedProduct?.capacityPerSlot} pax</span>
                     </div>
                  </div>

                  {/* Toggle Bloqueio */}
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${editForm.isBlocked ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-primary'}`}
                       onClick={() => setEditForm({...editForm, isBlocked: !editForm.isBlocked})}
                  >
                     <div className="flex items-center gap-3">
                        {editForm.isBlocked ? <Lock className="text-red-500" size={24}/> : <Unlock className="text-green-500" size={24}/>}
                        <div>
                           <div className={`font-bold ${editForm.isBlocked ? 'text-red-700' : 'text-gray-800'}`}>
                              {editForm.isBlocked ? 'Dia Bloqueado' : 'Vendas Abertas'}
                           </div>
                           <div className="text-xs text-gray-500">
                              {editForm.isBlocked ? 'Ninguém poderá comprar para esta data.' : 'Disponível para reservas no site.'}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Editar Capacidade */}
                  <div className={`transition-opacity ${editForm.isBlocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Capacidade Total para este Dia</label>
                     <input 
                        type="number" 
                        value={editForm.totalSlots}
                        onChange={(e) => setEditForm({...editForm, totalSlots: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary outline-none"
                        min={editingDay.usedSlots} // Não pode ser menor que o já vendido
                     />
                     <p className="text-xs text-gray-400 mt-2 text-center">
                        Use isto para aumentar vagas (ônibus extra) ou reduzir (manutenção parcial).
                     </p>
                  </div>
               </div>

               <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button 
                     onClick={() => setEditingDay(null)}
                     className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                  >
                     Cancelar
                  </button>
                  <button 
                     onClick={handleSaveDay}
                     className="flex-1 py-3 bg-success hover:bg-success-dark text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                     <Save size={18}/> Salvar
                  </button>
               </div>
            </div>
         </div>
      )}
    </>
  );
}