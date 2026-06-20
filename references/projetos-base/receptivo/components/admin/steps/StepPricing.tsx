import React from 'react';
import { Tour, SeasonalRule, VehicleTier } from '@/types';
import { Trash, Calendar, Car, Users, Tag } from 'lucide-react';

export default function StepPricing({ data, update }: { data: Partial<Tour>, update: (d: any) => void }) {
  
  // -- LÓGICA DE SAZONALIDADE --
  const addRule = () => {
    // ID único para evitar conflitos de renderização
    const newRule: SeasonalRule = { id: `${Date.now()}-${Math.random()}`, startDate: '', endDate: '', price: 0, type: 'fixed' };
    update({ seasonalRules: [...(data.seasonalRules || []), newRule] });
  };

  const updateRule = (idx: number, field: keyof SeasonalRule, val: any) => {
    const rules = [...(data.seasonalRules || [])];
    rules[idx] = { ...rules[idx], [field]: val };
    update({ seasonalRules: rules });
  };

  // -- LÓGICA DE TIERS (VEÍCULOS) --
  const addTier = () => {
      const newTier: VehicleTier = { 
        id: `${Date.now()}-${Math.random()}`, 
        vehicleName: '', 
        minPax: 1, 
        maxPax: 4, 
        price: 0,
        promotionalPrice: 0 
      };
      update({ vehicleTiers: [...(data.vehicleTiers || []), newTier] });
  };

  const updateTier = (index: number, field: keyof VehicleTier, val: any) => {
      const tiers = [...(data.vehicleTiers || [])];
      tiers[index] = { ...tiers[index], [field]: val };
      update({ vehicleTiers: tiers });
  };

  // -- HELPER DE SEGURANÇA PARA NÚMEROS --
  // Impede que o campo fique vazio (NaN) ou receba letras, o que causava erro no banco
  const handleNumberInput = (val: string, isFloat: boolean = false) => {
    if (val === '') return 0; // Se apagar tudo, vira 0
    const num = isFloat ? parseFloat(val) : parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* 1. SELETOR DE MODELO DE COBRANÇA */}
      <div className="bg-blue-50 p-6 rounded-xl flex flex-col md:flex-row gap-8 border border-blue-100">
         <div className="flex-1">
            <label className="block text-xs font-bold uppercase mb-2 text-blue-900">Modelo de Cobrança</label>
            <div className="flex gap-4">
               <button onClick={() => update({ pricingType: 'per_person' })} className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold text-sm flex items-center justify-center gap-2 ${data.pricingType === 'per_person' ? 'border-primary bg-white text-primary' : 'border-transparent bg-blue-100/50 text-blue-800'}`}>
                  <Users size={18}/> Por Pessoa
               </button>
               <button onClick={() => update({ pricingType: 'per_vehicle' })} className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold text-sm flex items-center justify-center gap-2 ${data.pricingType === 'per_vehicle' ? 'border-primary bg-white text-primary' : 'border-transparent bg-blue-100/50 text-blue-800'}`}>
                  <Car size={18}/> Por Veículo (Tier)
               </button>
            </div>
         </div>
         
         {/* Campos de Preço - SÓ APARECEM SE FOR POR PESSOA */}
         {data.pricingType === 'per_person' && (
             <div className="flex-1 grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                    <label className="block text-xs font-bold uppercase mb-2 text-blue-900">Preço Base (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-500 font-bold">R$</span>
                        <input 
                            type="number" 
                            value={data.basePrice ?? 0} 
                            onChange={e => update({ basePrice: handleNumberInput(e.target.value, true) })}
                            className="w-full border p-3 pl-10 rounded-lg text-xl font-bold text-gray-800 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase mb-2 text-green-700 flex items-center gap-1"><Tag size={12}/> Promocional</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-green-600 font-bold">R$</span>
                        <input 
                            type="number" 
                            value={data.pricePromotional ?? 0} 
                            onChange={e => update({ pricePromotional: handleNumberInput(e.target.value, true) })}
                            className="w-full border border-green-300 bg-green-50 p-3 pl-10 rounded-lg text-xl font-bold text-green-800 focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>
             </div>
         )}
         {data.pricingType === 'per_vehicle' && (
             <div className="flex-1 flex items-center justify-center text-blue-800 text-sm font-medium bg-blue-100/50 rounded-lg animate-fade-in">
                 Defina os preços nos Tiers de Veículos abaixo.
             </div>
         )}
      </div>

      {/* 2. TABELA DE VEÍCULOS (TIERS) */}
      {data.pricingType === 'per_vehicle' && (
         <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2"><Car size={18}/> Tiers de Veículos</h3>
                <button onClick={addTier} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded font-bold transition">+ Veículo</button>
            </div>
            <div className="space-y-3">
                {data.vehicleTiers?.map((tier, idx) => (
                    <div key={tier.id || idx} className="flex flex-col md:flex-row gap-4 items-end bg-white p-3 rounded-lg border shadow-sm">
                        
                        {/* Nome do Veículo */}
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-gray-400">NOME DO VEÍCULO</label>
                            <input 
                                value={tier.vehicleName} 
                                onChange={e => updateTier(idx, 'vehicleName', e.target.value)} 
                                className="border p-2 rounded w-full text-sm font-bold" 
                                placeholder="Ex: Sedan Executivo"
                            />
                        </div>

                        {/* Capacidade (Min/Max) */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="w-20">
                                <label className="text-[10px] font-bold text-gray-400">MIN PAX</label>
                                <input 
                                    type="number" 
                                    value={tier.minPax} 
                                    onChange={e => updateTier(idx, 'minPax', handleNumberInput(e.target.value))} 
                                    className="border p-2 rounded w-full text-sm text-center"
                                />
                            </div>
                            <div className="w-20">
                                <label className="text-[10px] font-bold text-gray-400">MAX PAX</label>
                                <input 
                                    type="number" 
                                    value={tier.maxPax} 
                                    onChange={e => updateTier(idx, 'maxPax', handleNumberInput(e.target.value))} 
                                    className="border p-2 rounded w-full text-sm text-center"
                                />
                            </div>
                        </div>
                        
                        {/* Preços (Normal e Promo) */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="w-28">
                                <label className="text-[10px] font-bold text-gray-400">PREÇO (R$)</label>
                                <input 
                                    type="number" 
                                    value={tier.price} 
                                    onChange={e => updateTier(idx, 'price', handleNumberInput(e.target.value, true))} 
                                    className="border p-2 rounded w-full text-sm font-bold text-gray-700"
                                />
                            </div>
                            <div className="w-28">
                                <label className="text-[10px] font-bold text-green-600 flex items-center gap-1"><Tag size={10}/> PROMO</label>
                                <input 
                                    type="number" 
                                    value={tier.promotionalPrice || ''} 
                                    onChange={e => updateTier(idx, 'promotionalPrice', handleNumberInput(e.target.value, true))} 
                                    className="border border-green-200 bg-green-50 p-2 rounded w-full text-sm font-bold text-green-700 placeholder-green-200"
                                    placeholder="--"
                                />
                            </div>
                        </div>

                        {/* Botão Remover */}
                        <button 
                            onClick={() => update({ vehicleTiers: data.vehicleTiers?.filter((_, i) => i !== idx) })} 
                            className="text-red-400 p-2 hover:bg-red-50 rounded mb-0.5"
                            title="Remover veículo"
                        >
                            <Trash size={16}/>
                        </button>
                    </div>
                ))}
                
                {(!data.vehicleTiers || data.vehicleTiers.length === 0) && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        Nenhum veículo cadastrado. Adicione um para definir os preços.
                    </div>
                )}
            </div>
         </div>
      )}

      {/* 3. REGRAS DE SAZONALIDADE */}
      <div className="border-t pt-6">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold flex items-center gap-2">
               <Calendar size={18} className="text-orange-500" /> Regras de Sazonalidade
             </h3>
             <button onClick={addRule} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 transition font-bold">
               + Adicionar Período
             </button>
         </div>
         
         <div className="space-y-3">
            {data.seasonalRules?.map((rule, idx) => (
               <div key={rule.id || idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white border border-orange-100 p-4 rounded-xl shadow-sm">
                  <div>
                     <label className="text-[10px] font-bold text-gray-400">INÍCIO</label>
                     <input type="date" value={rule.startDate} onChange={e => updateRule(idx, 'startDate', e.target.value)} className="border p-1.5 rounded text-sm"/>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-400">FIM</label>
                     <input type="date" value={rule.endDate} onChange={e => updateRule(idx, 'endDate', e.target.value)} className="border p-1.5 rounded text-sm"/>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-400">TIPO</label>
                     <select value={rule.type} onChange={e => updateRule(idx, 'type', e.target.value)} className="border p-1.5 rounded text-sm h-[34px] bg-white">
                        <option value="fixed">Fixo (R$)</option>
                        <option value="percentage">% Aumento</option>
                     </select>
                  </div>
                  <div className="flex-1">
                     <label className="text-[10px] font-bold text-gray-400">VALOR</label>
                     <input 
                        type="number" 
                        value={rule.price} 
                        onChange={e => updateRule(idx, 'price', handleNumberInput(e.target.value, true))} 
                        className="border p-1.5 rounded text-sm w-full font-bold text-green-700"
                     />
                  </div>
                  <button onClick={() => update({ seasonalRules: data.seasonalRules?.filter((_, i) => i !== idx) })} className="text-red-400 p-2 hover:bg-red-50 rounded">
                     <Trash size={16} />
                  </button>
               </div>
            ))}
            {(!data.seasonalRules || data.seasonalRules.length === 0) && (
               <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                  Nenhuma regra de data definida.
               </div>
            )}
         </div>
      </div>
    </div>
  );
}