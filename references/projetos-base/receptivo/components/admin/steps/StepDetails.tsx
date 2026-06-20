'use client';

import React, { useState } from 'react';
import { Tour, ItineraryItem } from '@/types';
import RichTextEditor from '@/components/RichTextEditor';
import { Wand2, Plus, X, Clock, MapPin, Trash } from 'lucide-react';
import { autoFillTranslations } from '@/utils/autoTranslate';

interface StepDetailsProps {
  data: Partial<Tour>;
  update: (data: Partial<Tour>) => void;
}

type TabLang = 'pt' | 'en' | 'es';

export default function StepDetails({ data, update }: StepDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabLang>('pt');
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  // --- 1. LÓGICA DE TRADUÇÃO EM MASSA (Incluindo Roteiro) ---
  const handleAutoTranslate = async () => {
    setLoadingTranslation(true);
    
    try {
        // A. Traduzir Descrição Completa
        const fullDescPt = data.fullDescription?.pt || '';
        const descTranslations = await autoFillTranslations(
          fullDescPt, 
          data.fullDescription?.en, 
          data.fullDescription?.es
        );

        // B. Helper para traduzir arrays (Listas)
        const translateArray = async (arrPt: string[], currentEn: string[], currentEs: string[]) => {
            if (!arrPt?.length) return { en: currentEn || [], es: currentEs || [] };
            
            const newEn = [...(currentEn || [])];
            const newEs = [...(currentEs || [])];

            // Garante que os arrays de destino tenham o mesmo tamanho
            while(newEn.length < arrPt.length) newEn.push('');
            while(newEs.length < arrPt.length) newEs.push('');

            // Traduz item a item
            const tasks = arrPt.map(async (item, idx) => {
                const t = await autoFillTranslations(item, newEn[idx], newEs[idx]);
                newEn[idx] = t.en;
                newEs[idx] = t.es;
            });
            await Promise.all(tasks);

            return { en: newEn, es: newEs };
        };

        const highlightsTrans = await translateArray(data.highlights?.pt || [], data.highlights?.en || [], data.highlights?.es || []);
        const includedTrans = await translateArray(data.included?.pt || [], data.included?.en || [], data.included?.es || []);
        const notIncludedTrans = await translateArray(data.notIncluded?.pt || [], data.notIncluded?.en || [], data.notIncluded?.es || []);

        // C. Traduzir Roteiro (Itinerary) - NOVO
        const currentItinerary = data.itinerary || [];
        const newItinerary = await Promise.all(currentItinerary.map(async (item) => {
            // Se tiver texto em PT, traduz activity
            if (item.activity?.pt) {
                const t = await autoFillTranslations(item.activity.pt, item.activity.en, item.activity.es);
                return {
                    ...item,
                    activity: {
                        pt: item.activity.pt,
                        en: t.en,
                        es: t.es
                    }
                };
            }
            return item;
        }));

        // Atualiza tudo
        update({
          ...data,
          fullDescription: {
            pt: fullDescPt,
            en: descTranslations.en,
            es: descTranslations.es
          },
          highlights: {
            pt: data.highlights?.pt || [],
            en: highlightsTrans.en,
            es: highlightsTrans.es
          },
          included: {
            pt: data.included?.pt || [],
            en: includedTrans.en,
            es: includedTrans.es
          },
          notIncluded: {
            pt: data.notIncluded?.pt || [],
            en: notIncludedTrans.en,
            es: notIncludedTrans.es
          },
          itinerary: newItinerary
        });

        alert('Tradução concluída com sucesso!');
    } catch (error) {
        console.error(error);
        alert('Erro ao traduzir. Veja o console.');
    } finally {
        setLoadingTranslation(false);
    }
  };

  // --- HELPERS DE LISTAS ---
  const addItem = (field: 'highlights' | 'included' | 'notIncluded') => {
    const list = data[field]?.[activeTab] || [];
    const newList = [...list, ''];
    
    // Precisamos atualizar o objeto de idioma específico dentro do campo
    const fieldData = data[field] || { pt: [], en: [], es: [] };
    
    update({
      ...data,
      [field]: {
        ...fieldData,
        [activeTab]: newList
      }
    });
  };

  const updateItem = (field: 'highlights' | 'included' | 'notIncluded', index: number, val: string) => {
    const fieldData = data[field] || { pt: [], en: [], es: [] };
    const list = [...(fieldData[activeTab] || [])];
    list[index] = val;

    update({
      ...data,
      [field]: {
        ...fieldData,
        [activeTab]: list
      }
    });
  };

  const removeItem = (field: 'highlights' | 'included' | 'notIncluded', index: number) => {
    const fieldData = data[field] || { pt: [], en: [], es: [] };
    const list = [...(fieldData[activeTab] || [])];
    list.splice(index, 1);

    update({
      ...data,
      [field]: {
        ...fieldData,
        [activeTab]: list
      }
    });
  };

  // --- HELPERS DE ROTEIRO ---
  const addItineraryItem = () => {
      const newItem: ItineraryItem = {
          time: '00:00',
          activity: { pt: '', en: '', es: '' }
      };
      update({ ...data, itinerary: [...(data.itinerary || []), newItem] });
  };

  const updateItineraryItem = (index: number, field: 'time' | 'activity', val: string) => {
      const list = [...(data.itinerary || [])];
      if (field === 'time') {
          list[index] = { ...list[index], time: val };
      } else {
          // Atualiza activity apenas no idioma ativo
          list[index] = { 
              ...list[index], 
              activity: { 
                  ...list[index].activity, 
                  [activeTab]: val 
              } 
          };
      }
      update({ ...data, itinerary: list });
  };

  const removeItineraryItem = (index: number) => {
      const list = [...(data.itinerary || [])];
      list.splice(index, 1);
      update({ ...data, itinerary: list });
  };

  return (
    <div className="space-y-8">
      
      {/* Header com Abas e Botão Traduzir */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
        <div className="flex gap-2">
          {(['pt', 'en', 'es'] as TabLang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                activeTab === lang 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {lang === 'pt' ? '🇧🇷 Português' : lang === 'en' ? '🇺🇸 Inglês' : '🇪🇸 Espanhol'}
            </button>
          ))}
        </div>

        <button 
            onClick={handleAutoTranslate}
            disabled={loadingTranslation}
            className="flex items-center gap-2 text-purple-700 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm border border-purple-200"
        >
            <Wand2 size={16} className={loadingTranslation ? "animate-spin" : ""} />
            {loadingTranslation ? 'Traduzindo Tudo...' : 'Traduzir Automaticamente'}
        </button>
      </div>

      <div className="animate-fade-in space-y-8">
        
        {/* 1. Editor de Texto Rico */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descrição Completa ({activeTab.toUpperCase()})
            <span className="text-gray-400 font-normal ml-2 text-xs">- Conteúdo detalhado da página do passeio</span>
          </label>
          
          <RichTextEditor
            value={data.fullDescription?.[activeTab] || ''}
            onChange={(val) => update({
              ...data,
              fullDescription: {
                ...data.fullDescription!,
                [activeTab]: val
              }
            })}
            placeholder="Descreva a experiência em detalhes..."
          />
        </div>

        {/* 2. Listas (Destaques, Inclui, Não Inclui) */}
        <div className="grid md:grid-cols-3 gap-6">
            {/* Destaques */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-sm text-gray-700">Destaques</label>
                    <button onClick={() => addItem('highlights')} className="text-primary hover:bg-white p-1 rounded-full transition-colors"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                    {(data.highlights?.[activeTab] || []).map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                value={item} 
                                onChange={(e) => updateItem('highlights', idx, e.target.value)}
                                className="flex-1 text-sm p-2 rounded border focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Ex: Vista panorâmica"
                            />
                            <button onClick={() => removeItem('highlights', idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inclui */}
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-sm text-green-800">✅ O que Inclui</label>
                    <button onClick={() => addItem('included')} className="text-green-600 hover:bg-white p-1 rounded-full transition-colors"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                    {(data.included?.[activeTab] || []).map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                value={item} 
                                onChange={(e) => updateItem('included', idx, e.target.value)}
                                className="flex-1 text-sm p-2 rounded border focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="Ex: Transporte"
                            />
                            <button onClick={() => removeItem('included', idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Não Inclui */}
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-sm text-red-800">❌ Não Inclui</label>
                    <button onClick={() => addItem('notIncluded')} className="text-red-600 hover:bg-white p-1 rounded-full transition-colors"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                    {(data.notIncluded?.[activeTab] || []).map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                value={item} 
                                onChange={(e) => updateItem('notIncluded', idx, e.target.value)}
                                className="flex-1 text-sm p-2 rounded border focus:ring-1 focus:ring-red-500 outline-none"
                                placeholder="Ex: Bebidas"
                            />
                            <button onClick={() => removeItem('notIncluded', idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 3. ROTEIRO / ITINERÁRIO (NOVA SEÇÃO) */}
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <MapPin size={20} className="text-primary"/> Roteiro / Cronograma
                 </h3>
                 <button 
                    onClick={addItineraryItem}
                    className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                 >
                     <Plus size={14}/> Adicionar Parada
                 </button>
             </div>
             
             <div className="space-y-3">
                 {(!data.itinerary || data.itinerary.length === 0) && (
                     <p className="text-gray-400 text-sm italic text-center py-4">Nenhum item adicionado ao roteiro.</p>
                 )}

                 {data.itinerary?.map((item, idx) => (
                     <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                         {/* Campo Hora */}
                         <div className="w-24 shrink-0">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Horário</label>
                             <div className="relative">
                                 <Clock size={14} className="absolute left-2 top-2.5 text-gray-400"/>
                                 <input 
                                     value={item.time}
                                     onChange={(e) => updateItineraryItem(idx, 'time', e.target.value)}
                                     className="w-full pl-7 p-2 text-sm border rounded font-bold text-center outline-none focus:border-primary"
                                     placeholder="00:00"
                                 />
                             </div>
                         </div>

                         {/* Campo Atividade (depende da Aba) */}
                         <div className="flex-1">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                 Atividade ({activeTab})
                             </label>
                             <input 
                                 value={item.activity[activeTab] || ''}
                                 onChange={(e) => updateItineraryItem(idx, 'activity', e.target.value)}
                                 className="w-full p-2 text-sm border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                 placeholder="Descreva a atividade..."
                             />
                         </div>

                         {/* Remover */}
                         <button 
                            onClick={() => removeItineraryItem(idx)}
                            className="mt-6 text-gray-400 hover:text-red-500 transition-colors p-1"
                         >
                             <Trash size={16}/>
                         </button>
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
}