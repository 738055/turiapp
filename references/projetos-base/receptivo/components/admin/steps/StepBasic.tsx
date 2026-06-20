import React, { useEffect, useState } from 'react';
import { Tour, Category } from '@/types';
import { CategoryService } from '@/services/categoryService';
import { Star, MapPin } from 'lucide-react';

export default function StepBasic({ data, update }: { data: Partial<Tour>, update: (d: any) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Carrega categorias ao montar o componente
  useEffect(() => {
    const fetchCats = async () => {
        try {
            const list = await CategoryService.getAll();
            setCategories(list);
        } catch (error) {
            console.error("Erro ao carregar categorias", error);
        } finally {
            setLoadingCats(false);
        }
    };
    fetchCats();
  }, []);

  const updateTitle = (lang: 'pt'|'en'|'es', val: string) => 
    update({ title: { ...data.title, [lang]: val } });

  const updateDesc = (lang: 'pt'|'en'|'es', val: string) => 
    update({ description: { ...data.description, [lang]: val } });
    
  // Helper para atualizar Localização
  const updateLocation = (lang: 'pt'|'en'|'es', val: string) => 
    update({ location: { ...data.location, [lang]: val } });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
          <select 
            value={data.status} onChange={e => update({ status: e.target.value })}
            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
          </select>
        </div>

        {/* Categoria */}
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
           <select 
            value={data.category} onChange={e => update({ category: e.target.value })}
            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none"
            disabled={loadingCats}
          >
             <option value="">{loadingCats ? 'Carregando...' : 'Selecione...'}</option>
             
             {/* Categorias Dinâmicas */}
             {categories.map(cat => (
                 <option key={cat.id} value={cat.slug}>
                     {cat.name.pt}
                 </option>
             ))}
             
             {/* Fallback se não houver categorias */}
             {!loadingCats && categories.length === 0 && (
                 <option value="geral">Geral (Sem categoria definida)</option>
             )}
          </select>
          {categories.length === 0 && !loadingCats && (
              <p className="text-xs text-red-500 mt-1">Nenhuma categoria encontrada. Crie uma no menu Categorias.</p>
          )}
        </div>

        {/* Destaque (Featured) */}
        <div className="flex items-end pb-0.5">
            <label className={`flex items-center gap-3 cursor-pointer border p-2 rounded-lg w-full transition-all select-none ${data.featured ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        checked={data.featured || false} 
                        onChange={e => update({ featured: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </div>
                <div className="flex flex-col">
                    <span className={`font-bold text-sm flex items-center gap-1 ${data.featured ? 'text-yellow-700' : 'text-gray-600'}`}>
                        <Star size={14} className={data.featured ? "fill-yellow-500 text-yellow-500" : "text-gray-400"} />
                        Destaque na Home
                    </span>
                    <span className="text-[10px] text-gray-500 leading-tight">Aparecerá em "Nossas Seleções"</span>
                </div>
            </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-bold text-lg mb-4 text-primary">Informações Principais (PT)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome do Passeio</label>
                <input 
                    value={data.title?.pt} onChange={e => updateTitle('pt', e.target.value)}
                    className="w-full border p-3 rounded-lg font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Cataratas do Iguaçu VIP"
                />
            </div>
            {/* NOVO CAMPO DE LOCALIZAÇÃO (PT) */}
            <div>
                 <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin size={12}/> Localização
                 </label>
                 <input 
                    value={data.location?.pt} onChange={e => updateLocation('pt', e.target.value)}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Foz do Iguaçu, PR"
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descrição Curta</label>
            <textarea 
                value={data.description?.pt} onChange={e => updateDesc('pt', e.target.value)}
                className="w-full border p-3 rounded-lg h-24 focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="Resumo atraente para aparecer nos cards da listagem..."
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
        <div>
           <h4 className="text-sm font-bold uppercase text-blue-800 mb-3 flex items-center gap-2">
               🇬🇧 Inglês <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto</span>
           </h4>
           <div className="grid grid-cols-3 gap-2 mb-2">
               <input 
                  value={data.title?.en} onChange={e => updateTitle('en', e.target.value)}
                  className="col-span-2 border p-2 rounded text-sm bg-white outline-none focus:border-blue-300" 
                  placeholder="Title (EN)"
               />
               <input 
                  value={data.location?.en} onChange={e => updateLocation('en', e.target.value)}
                  className="col-span-1 border p-2 rounded text-sm bg-white outline-none focus:border-blue-300" 
                  placeholder="Location (EN)"
               />
           </div>
           <textarea 
              value={data.description?.en} onChange={e => updateDesc('en', e.target.value)}
              className="w-full border p-2 rounded h-20 text-sm bg-white outline-none focus:border-blue-300 resize-none" 
              placeholder="Short description (EN)"
           />
        </div>
        <div>
           <h4 className="text-sm font-bold uppercase text-orange-800 mb-3 flex items-center gap-2">
               🇪🇸 Espanhol <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Auto</span>
           </h4>
           <div className="grid grid-cols-3 gap-2 mb-2">
               <input 
                  value={data.title?.es} onChange={e => updateTitle('es', e.target.value)}
                  className="col-span-2 border p-2 rounded text-sm bg-white outline-none focus:border-orange-300" 
                  placeholder="Título (ES)"
               />
               <input 
                  value={data.location?.es} onChange={e => updateLocation('es', e.target.value)}
                  className="col-span-1 border p-2 rounded text-sm bg-white outline-none focus:border-orange-300" 
                  placeholder="Ubicación (ES)"
               />
           </div>
           <textarea 
              value={data.description?.es} onChange={e => updateDesc('es', e.target.value)}
              className="w-full border p-2 rounded h-20 text-sm bg-white outline-none focus:border-orange-300 resize-none" 
              placeholder="Descripción (ES)"
           />
        </div>
      </div>
    </div>
  );
}