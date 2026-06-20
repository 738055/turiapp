'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { Product, Supplier, Category } from '@/app/types';
import { formatCurrency } from '@/app/lib/productUtils';
import { Save, ArrowLeft, ArrowRight, Upload, Check, X, Image as ImageIcon, MapPin, Tag, Users, Luggage, Plane, Car, Plus } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface ProductFormClientProps {
  initialData?: Product | null;
  mode: 'create' | 'edit';
}

export default function ProductFormClient({ initialData, mode }: ProductFormClientProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', 
    description: '', 
    price: 0, 
    costPrice: 0, 
    type: 'tour',
    imageUrl: '', 
    gallery: [], 
    features: [], 
    notIncluded: [], 
    tags: [],
    active: true, 
    isFeatured: false, 
    supplierId: '', 
    isFixedTime: true, 
    capacityPerSlot: 0, 
    location: 'Foz do Iguaçu', 
    duration: '4 horas',
    pricingTiers: [],
    rating: null,
    reviewsCount: null,

    transferDetails: {
       serviceType: 'private',
       pricingModel: 'per_vehicle',
       vehicleModel: '',
       passengerCapacity: 4,
       luggageCapacity: 4,
       transferCategory: 'tour', // Default é transfer normal
       airportCode: '',
       city: '',
       routeType: 'airport_to_hotel'
    },
    ...initialData,
    categoryId: initialData?.categoryId || initialData?.category || ''
  });

  const [tempTierRegular, setTempTierRegular] = useState({ name: '', price: 0, costPrice: 0 });
  const [tempTierPrivate, setTempTierPrivate] = useState({ name: '', price: 0, costPrice: 0 });
  const [tempFeature, setTempFeature] = useState('');
  const [tempNotIncluded, setTempNotIncluded] = useState('');
  const [tempTag, setTempTag] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      const { data: supData } = await supabase.from('suppliers').select('*').eq('active', true).order('name');
      if (supData) setSuppliers(supData as Supplier[]);
      const { data: catData } = await supabase.from('categories').select('*').eq('active', true);
      if (catData) setCategories(catData as Category[]);
    };
    loadDependencies();
  }, [supabase]);

  // Função para gerenciar a seleção de Tipo visualmente
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'airport_transfer') {
      setFormData({
        ...formData, 
        type: 'transfer', 
        transferDetails: { ...(formData.transferDetails as any), transferCategory: 'airport' }
      });
    } else if (val === 'transfer') {
      setFormData({
        ...formData, 
        type: 'transfer', 
        transferDetails: { ...(formData.transferDetails as any), transferCategory: 'tour' }
      });
    } else {
      setFormData({ ...formData, type: val as any });
    }
  };

  const getDisplayType = () => {
    if (formData.type === 'transfer' && formData.transferDetails?.transferCategory === 'airport') return 'airport_transfer';
    return formData.type || 'tour';
  };

  const addArrayItem = (field: 'features' | 'notIncluded' | 'tags', value: string, setter: any) => {
    if (!value.trim()) return;
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), value.trim()] }));
    setter('');
  };

  const removeArrayItem = (field: 'features' | 'notIncluded' | 'tags' | 'gallery', index: number) => {
    setFormData(prev => {
      const newArray = [...(prev[field as keyof typeof prev] as any[] || [])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    try {
      setLoading(true);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error } = await supabase.storage.from('products').upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (isGallery) {
         setFormData(prev => ({ ...prev, gallery: [...((prev.gallery as string[]) || []), ...uploadedUrls] }));
      } else {
         setFormData({ ...formData, imageUrl: uploadedUrls[0] });
      }
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!formData.name || !formData.price) throw new Error("Nome e Preço são obrigatórios.");

      const payload = {
        title: formData.name,
        slug: formData.slug || formData.name?.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w-]+/g, ''),
        description: formData.description,
        price: formData.price,
        cost_price: formData.costPrice,
        supplier_id: formData.supplierId || null,
        is_fixed_time: formData.isFixedTime,
        capacity_per_slot: formData.capacityPerSlot,
        images: formData.gallery?.length ? formData.gallery : (formData.imageUrl ? [formData.imageUrl] : []),
        category_id: formData.categoryId || null,
        availability: formData.active,
        featured: formData.isFeatured,
        location: formData.location,
        duration: formData.duration,
        includes: formData.features, 
        excludes: formData.notIncluded,
        cancellation_policy: formData.cancellationPolicy,
        important_info: formData.importantInfo,
        rating: formData.rating ?? null,
        reviews_count: formData.reviewsCount ?? null,

        metadata: {
           type: formData.type,
           tags: formData.tags,
           features: formData.features || [],
           notIncluded: formData.notIncluded || [],
           cancellationPolicy: formData.cancellationPolicy || '',
           importantInfo: formData.importantInfo || '',
           is_free_cancellation: formData.is_free_cancellation ?? false,
           transferDetails: formData.type === 'transfer' ? formData.transferDetails : undefined,
           pricingTiers: formData.pricingTiers,
        },
        updated_at: new Date().toISOString()
      };

      if (mode === 'create') {
        await supabase.from('products').insert([payload]);
      } else {
        await supabase.from('products').update(payload).eq('id', initialData?.id);
      }
      alert('Produto salvo com sucesso!');
      window.location.href = '/admin/products';
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {mode === 'create' ? 'Cadastrar Produto' : `Editar: ${initialData?.name}`}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Passo {currentStep} de {totalSteps}</p>
         </div>
         <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
            <ArrowLeft size={16}/> Sair
         </button>
      </div>

      <div className="flex h-2 bg-gray-100">
         <div className="bg-primary-600 transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
      </div>

      <div className="p-8 min-h-[400px]">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. Informações Básicas</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Produto</label>
                <select className="w-full border p-3 rounded-lg bg-white" value={getDisplayType()} onChange={handleTypeChange}>
                  <option value="tour">Passeio / Atrativo</option>
                  <option value="transfer">Transfer Turístico / Comum</option>
                  <option value="airport_transfer">Transfer Aeroporto</option>
                  <option value="ticket">Ingresso</option>
                  <option value="package">Pacote</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                <select 
                  className="w-full border p-3 rounded-lg bg-white"
                  value={formData.categoryId || ''}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                >
                   <option value="">Selecione...</option>
                   {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                   ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                <input type="text" className="w-full border p-3 rounded-lg" placeholder="Ex: Transfer IGU para Hotéis em Foz" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Comercial</label>
                <textarea className="w-full border p-3 rounded-lg h-32" placeholder="Descreva o serviço..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">2. Detalhes da Experiência</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Check size={16} className="text-green-600"/> O que inclui?</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Motorista Bilingue..." value={tempFeature} onChange={e => setTempFeature(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem('features', tempFeature, setTempFeature)} />
                  <button onClick={() => addArrayItem('features', tempFeature, setTempFeature)} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features?.map((feat, idx) => (
                    <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                      {feat} <X size={12} className="cursor-pointer" onClick={() => removeArrayItem('features', idx)}/>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><X size={16} className="text-red-600"/> Não inclui</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Pedágio, Taxa extra..." value={tempNotIncluded} onChange={e => setTempNotIncluded(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem('notIncluded', tempNotIncluded, setTempNotIncluded)} />
                  <button onClick={() => addArrayItem('notIncluded', tempNotIncluded, setTempNotIncluded)} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.notIncluded?.map((item, idx) => (
                    <span key={idx} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                      {item} <X size={12} className="cursor-pointer" onClick={() => removeArrayItem('notIncluded', idx)}/>
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Tag size={16} className="text-primary-600"/> Tags (Selos no Card)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Recepção com Placa..." value={tempTag} onChange={e => setTempTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem('tags', tempTag, setTempTag)} />
                  <button onClick={() => addArrayItem('tags', tempTag, setTempTag)} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map((tag, idx) => (
                    <span key={idx} className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      {tag} <X size={12} className="cursor-pointer" onClick={() => removeArrayItem('tags', idx)}/>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">3. Fotos e Galeria</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-4 flex gap-4">
                 <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden group">
                   {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500 text-center px-2">Capa Principal</span>}
                   <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
                 {formData.gallery?.map((img, idx) => (
                    <div key={idx} className="w-24 h-24 bg-gray-100 rounded-lg relative overflow-hidden group border border-gray-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <button onClick={() => removeArrayItem('gallery', idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    </div>
                 ))}
                 <div className="w-24 h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center relative hover:bg-gray-100 cursor-pointer">
                    <Upload size={20} className="text-gray-400 mb-1"/>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Adicionar</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
           <div className="space-y-6 animate-fadeIn">
             <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">4. Preços e Operação</h2>

             {/* BLOCO EXCLUSIVO PARA TRANSFER DE AEROPORTO */}
             {formData.type === 'transfer' && formData.transferDetails?.transferCategory === 'airport' && (
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl mb-6">
                   <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                     <Plane size={20}/> Logística de Transfer Aeroporto
                   </h3>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                         <label className="block text-sm font-bold text-purple-900 mb-1">Aeroporto</label>
                         <input 
                            type="text" className="w-full border p-3 rounded-lg" placeholder="Ex: IGU, GRU, GIG..."
                            value={formData.transferDetails?.airportCode || ''}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, airportCode: e.target.value } })}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-purple-900 mb-1">Cidade</label>
                         <input 
                            type="text" className="w-full border p-3 rounded-lg" placeholder="Ex: Foz do Iguaçu, CDE..."
                            value={formData.transferDetails?.city || ''}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, city: e.target.value } })}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-purple-900 mb-1">Sentido do Trajeto</label>
                         <select 
                            className="w-full border p-3 rounded-lg bg-white"
                            value={formData.transferDetails?.routeType || 'airport_to_hotel'}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, routeType: e.target.value as any } })}
                         >
                            <option value="airport_to_hotel">Chegada (Aeroporto ➔ Hotel)</option>
                            <option value="hotel_to_airport">Partida (Hotel ➔ Aeroporto)</option>
                            <option value="round_trip">Ida e Volta (In & Out)</option>
                         </select>
                      </div>
                   </div>
                </div>
             )}

             {/* CONFIGURAÇÕES GERAIS DE VEÍCULO (Aparece para Todos os Transfers) */}
             {formData.type === 'transfer' && (
                <div className="bg-primary-50 border border-primary-100 p-6 rounded-xl mb-6">
                   <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">Detalhes do Veículo e Cobrança</h3>
                   
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Serviço</label>
                         <select 
                            className="w-full border p-3 rounded-lg"
                            value={formData.transferDetails?.serviceType}
                            onChange={e => setFormData({
                               ...formData, 
                               transferDetails: { ...formData.transferDetails as any, serviceType: e.target.value as any }
                            })}
                         >
                            <option value="private">Privativo (Apenas o cliente e grupo)</option>
                            <option value="shared">Compartilhado (Shuttle regular)</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Modelo de Cobrança</label>
                         <select 
                            className="w-full border p-3 rounded-lg"
                            value={formData.transferDetails?.pricingModel || 'per_vehicle'}
                            onChange={e => setFormData({
                               ...formData, 
                               transferDetails: { ...formData.transferDetails as any, pricingModel: e.target.value as any }
                            })}
                         >
                            <option value="per_vehicle">Preço Fixo pelo Veículo Inteiro (Carro)</option>
                            <option value="per_person">Preço por Passageiro (Pessoa)</option>
                         </select>
                      </div>
                   </div>
             
                   <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="col-span-3 md:col-span-1">
                         <label className="block text-sm font-bold text-gray-700 mb-1">Categoria do Veículo</label>
                         <input 
                            type="text" className="w-full border p-3 rounded-lg" placeholder="Ex: Sedan, Van, SUV"
                            value={formData.transferDetails?.vehicleModel || ''}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, vehicleModel: e.target.value } })}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Users size={14}/> Máx. Passageiros</label>
                         <input 
                            type="number" className="w-full border p-3 rounded-lg"
                            value={formData.transferDetails?.passengerCapacity || 0}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, passengerCapacity: parseInt(e.target.value) } })}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Luggage size={14}/> Máx. Malas (Grandes)</label>
                         <input 
                            type="number" className="w-full border p-3 rounded-lg"
                            value={formData.transferDetails?.luggageCapacity || 0}
                            onChange={e => setFormData({ ...formData, transferDetails: { ...formData.transferDetails as any, luggageCapacity: parseInt(e.target.value) } })}
                         />
                      </div>
                   </div>
                </div>
             )}

             <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço de Venda Principal</label>
                  <CurrencyInput value={formData.price || 0} onChange={(v) => setFormData({...formData, price: v})} className="w-full border p-3 rounded-lg font-bold text-green-700 text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Custo Fornecedor</label>
                  <CurrencyInput value={formData.costPrice || 0} onChange={(v) => setFormData({...formData, costPrice: v})} className="w-full border p-3 rounded-lg text-red-600" />
                </div>
             </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-5">O menor preço entre todas as variações será exibido como "A partir de" no card.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* ── REGULAR (Por Pessoa) ── */}
                <div className="border-2 border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2 border-b border-emerald-200">
                    <Users size={18} className="text-emerald-600" />
                    <span className="font-bold text-emerald-800 text-sm">Regular — Por Pessoa</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <input type="text" placeholder="Ex: Adulto, Criança 6-12 anos" className="w-full border p-2 rounded text-sm" value={tempTierRegular.name} onChange={e => setTempTierRegular({...tempTierRegular, name: e.target.value})} />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Venda</label>
                          <CurrencyInput value={tempTierRegular.price} onChange={(v) => setTempTierRegular({...tempTierRegular, price: v})} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Custo</label>
                          <CurrencyInput value={tempTierRegular.costPrice} onChange={(v) => setTempTierRegular({...tempTierRegular, costPrice: v})} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempTierRegular.name) return alert('Dê um nome para a tarifa!');
                          setFormData(prev => ({ ...prev, pricingTiers: [...(prev.pricingTiers || []), { ...tempTierRegular, mode: 'per_person' as const, id: Date.now().toString() }] }));
                          setTempTierRegular({ name: '', price: 0, costPrice: 0 });
                        }}
                        className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 text-sm flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Adicionar Tarifa
                      </button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {(formData.pricingTiers || []).filter(t => !t.mode || t.mode === 'per_person').map((tier) => (
                        <div key={tier.id} className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg">
                          <div>
                            <span className="font-bold text-gray-800 text-sm">{tier.name}</span>
                            <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                              <span>Venda: <b className="text-green-600">{formatCurrency(tier.price || 0)}</b></span>
                              <span>Custo: <b className="text-red-500">{formatCurrency(tier.costPrice || 0)}</b></span>
                            </div>
                          </div>
                          <button type="button" onClick={() => setFormData({...formData, pricingTiers: (formData.pricingTiers || []).filter(t => t.id !== tier.id)})} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                        </div>
                      ))}
                      {(formData.pricingTiers || []).filter(t => !t.mode || t.mode === 'per_person').length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-2">Nenhuma tarifa por pessoa</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── PRIVATIVO (Por Veículo) ── */}
                <div className="border-2 border-primary-200 rounded-xl overflow-hidden">
                  <div className="bg-primary-50 px-4 py-3 flex items-center gap-2 border-b border-primary-200">
                    <Car size={18} className="text-primary-600" />
                    <span className="font-bold text-primary-800 text-sm">Privativo — Por Veículo</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <input type="text" placeholder="Ex: Carro até 4 pax, Van até 15 pax" className="w-full border p-2 rounded text-sm" value={tempTierPrivate.name} onChange={e => setTempTierPrivate({...tempTierPrivate, name: e.target.value})} />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Venda</label>
                          <CurrencyInput value={tempTierPrivate.price} onChange={(v) => setTempTierPrivate({...tempTierPrivate, price: v})} className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Custo</label>
                          <CurrencyInput value={tempTierPrivate.costPrice} onChange={(v) => setTempTierPrivate({...tempTierPrivate, costPrice: v})} className="w-full border p-2 rounded text-sm" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempTierPrivate.name) return alert('Dê um nome para a tarifa!');
                          setFormData(prev => ({ ...prev, pricingTiers: [...(prev.pricingTiers || []), { ...tempTierPrivate, mode: 'per_vehicle' as const, id: Date.now().toString() }] }));
                          setTempTierPrivate({ name: '', price: 0, costPrice: 0 });
                        }}
                        className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 text-sm flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Adicionar Veículo
                      </button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {(formData.pricingTiers || []).filter(t => t.mode === 'per_vehicle').map((tier) => (
                        <div key={tier.id} className="flex justify-between items-center bg-primary-50/50 border border-primary-100 p-2.5 rounded-lg">
                          <div>
                            <span className="font-bold text-gray-800 text-sm">{tier.name}</span>
                            <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                              <span>Venda: <b className="text-green-600">{formatCurrency(tier.price || 0)}</b></span>
                              <span>Custo: <b className="text-red-500">{formatCurrency(tier.costPrice || 0)}</b></span>
                            </div>
                          </div>
                          <button type="button" onClick={() => setFormData({...formData, pricingTiers: (formData.pricingTiers || []).filter(t => t.id !== tier.id)})} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                        </div>
                      ))}
                      {(formData.pricingTiers || []).filter(t => t.mode === 'per_vehicle').length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-2">Nenhuma tarifa por veículo</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avaliação */}
            <div className="border-t pt-5 mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Avaliação (opcional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nota (0–10)</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={formData.rating ?? ''}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value === '' ? null : parseFloat(e.target.value) })}
                    className="w-full border p-3 rounded-lg"
                    placeholder="Ex: 9.5 — deixe vazio para Novo Produto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nº de Avaliações</label>
                  <input
                    type="number" min="0"
                    value={formData.reviewsCount ?? ''}
                    onChange={(e) => setFormData({ ...formData, reviewsCount: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                    className="w-full border p-3 rounded-lg"
                    placeholder="Ex: 128"
                  />
                </div>
              </div>
            </div>

           </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between">
         <button 
           onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
           className={`px-6 py-2 rounded-lg font-bold transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'}`}
         >
           Anterior
         </button>

         {currentStep < totalSteps ? (
            <button onClick={() => setCurrentStep(prev => prev + 1)} className="bg-primary-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700">
              Próximo <ArrowRight size={18}/>
            </button>
         ) : (
            <button onClick={handleSubmit} disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg">
              {loading ? 'Salvando...' : <><Save size={18}/> Finalizar Cadastro</>}
            </button>
         )}
      </div>
    </div>
  );
}
