'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { tourSchema, TourFormData } from './schemas';
import { Supplier, Category, Product, ItineraryItem, PricingTier } from '@/app/types';
import { revalidateTourCache } from '@/app/actions';
import {
  ArrowLeft, ArrowRight, Save, Check, X, Upload, Plus, Trash2,
  Clock, MapPin, Languages, Users, Tag, Image as ImageIcon, Car,
} from 'lucide-react';
import CurrencyInput from '../CurrencyInput';
import { formatCurrency } from '@/app/lib/productUtils';

interface TourWizardProps {
  initialData?: Product | null;
  mode: 'create' | 'edit';
}

const TOTAL_STEPS = 4;

const STEP_FIELDS: Record<number, (keyof TourFormData)[]> = {
  1: ['name', 'description', 'duration'],
  2: ['features'],
  3: ['imageUrl'],
  4: ['price'],
};

const GUIDE_LANGUAGES = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 'Mandarim'];

export default function TourWizard({ initialData, mode }: TourWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Arrays gerenciados fora do RHF (arrays de objetos complexos)
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialData?.itinerary || []);
  const [tempItinerary, setTempItinerary] = useState({ title: '', description: '', time: '' });
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(initialData?.pricingTiers || []);
  const [tempTierRegular, setTempTierRegular] = useState({ name: '', price: 0, costPrice: 0 });
  const [tempTierPrivate, setTempTierPrivate] = useState({ name: '', price: 0, costPrice: 0 });

  // Temporários para arrays de string
  const [tempFeature, setTempFeature] = useState('');
  const [tempNotIncluded, setTempNotIncluded] = useState('');
  const [tempTag, setTempTag] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || '',
      supplierId: initialData?.supplierId || '',
      location: initialData?.location || 'Foz do Iguaçu',
      duration: initialData?.duration || '4 horas',
      guideLanguages: initialData?.guideLanguages || [],
      meetingPoint: initialData?.importantInfo || '',
      features: initialData?.features || [],
      notIncluded: initialData?.notIncluded || [],
      tags: initialData?.tags || [],
      imageUrl: initialData?.imageUrl || '',
      gallery: initialData?.gallery || [],
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice,
      costPrice: initialData?.costPrice,
      is_free_cancellation: initialData?.is_free_cancellation ?? true,
      cancellationPolicy: initialData?.cancellationPolicy || '',
      importantInfo: initialData?.importantInfo || '',
      active: initialData?.active ?? true,
      isFeatured: initialData?.isFeatured ?? false,
      isFixedTime: initialData?.isFixedTime ?? true,
      capacityPerSlot: initialData?.capacityPerSlot,
      rating: initialData?.rating ?? null,
      reviewsCount: initialData?.reviewsCount ?? null,
    },
  });

  const features = watch('features');
  const notIncluded = watch('notIncluded');
  const tags = watch('tags');
  const gallery = watch('gallery') || [];
  const guideLanguages = watch('guideLanguages') || [];

  useEffect(() => {
    const load = async () => {
      const [{ data: sup }, { data: cat }] = await Promise.all([
        supabase.from('suppliers').select('*').eq('active', true).order('name'),
        supabase.from('categories').select('*').eq('active', true),
      ]);
      if (sup) setSuppliers(sup as Supplier[]);
      if (cat) setCategories(cat as Category[]);
    };
    load();
  }, [supabase]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const ext = file.name.split('.').pop();
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from('products').upload(name, file);
          if (error) throw error;
          return supabase.storage.from('products').getPublicUrl(name).data.publicUrl;
        }),
      );
      if (isGallery) {
        setValue('gallery', [...gallery, ...urls]);
      } else {
        setValue('imageUrl', urls[0]);
      }
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (field: 'features' | 'notIncluded' | 'tags', value: string, clear: () => void) => {
    if (!value.trim()) return;
    setValue(field, [...(watch(field) || []), value.trim()]);
    clear();
  };

  const removeFromArray = (field: 'features' | 'notIncluded' | 'tags', index: number) => {
    const arr = [...(watch(field) || [])];
    arr.splice(index, 1);
    setValue(field, arr);
  };

  const toggleLanguage = (lang: string) => {
    const current = guideLanguages;
    setValue(
      'guideLanguages',
      current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang],
    );
  };

  const addItinerary = () => {
    if (!tempItinerary.title) return;
    setItinerary((prev) => [...prev, { ...tempItinerary, id: Date.now().toString() } as any]);
    setTempItinerary({ title: '', description: '', time: '' });
  };

  const addTier = (mode: 'per_person' | 'per_vehicle') => {
    const temp = mode === 'per_person' ? tempTierRegular : tempTierPrivate;
    const setTemp = mode === 'per_person' ? setTempTierRegular : setTempTierPrivate;
    if (!temp.name || temp.price <= 0) return alert('Informe nome e preço da tarifa.');
    setPricingTiers((prev) => [...prev, { ...temp, mode, id: Date.now().toString() }]);
    setTemp({ name: '', price: 0, costPrice: 0 });
  };

  const advanceStep = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields as any);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: TourFormData) => {
    setLoading(true);
    try {
      // Calcula preço base = menor tier ou price informado
      const minTierPrice =
        pricingTiers.length > 0
          ? Math.min(...pricingTiers.map((t) => t.price))
          : data.price;
      const basePrice = Math.min(data.price, minTierPrice);

      const slug =
        initialData?.slug ||
        data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w-]+/g, '-');

      const payload = {
        title: data.name,
        slug,
        description: data.description,
        price: basePrice,
        cost_price: data.costPrice ?? null,
        compare_at_price: data.compareAtPrice ?? null,
        supplier_id: data.supplierId || null,
        is_fixed_time: data.isFixedTime,
        capacity_per_slot: data.capacityPerSlot ?? null,
        images: gallery.length ? gallery : data.imageUrl ? [data.imageUrl] : [],
        category_id: data.categoryId || null,
        availability: data.active,
        featured: data.isFeatured,
        location: data.location,
        duration: data.duration,
        includes: data.features || [],
        excludes: data.notIncluded || [],
        cancellation_policy: data.cancellationPolicy || '',
        important_info: data.importantInfo || '',
        rating: data.rating ?? null,
        reviews_count: data.reviewsCount ?? null,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(initialData?.metadata || {}),
          type: 'tour',
          tags: data.tags,
          features: data.features,
          notIncluded: data.notIncluded,
          cancellationPolicy: data.cancellationPolicy,
          is_free_cancellation: data.is_free_cancellation,
          importantInfo: data.importantInfo,
          guideLanguages: data.guideLanguages,
          pricingTiers,
          itinerary,
        },
      };

      if (mode === 'create') {
        const { data: newProduct, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        // slug is available on newProduct.slug
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', initialData?.id);
        if (error) throw error;
      }

      // Revalida o cache usando Server Action
      await revalidateTourCache(slug);

      alert('Passeio salvo com sucesso!');
      window.location.href = '/admin/products'; // Força o recarregamento total da SPA e limpa o cache do Contexto
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = watch('imageUrl');

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Cadastrar Passeio / Atrativo' : `Editar: ${initialData?.name}`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Passo {step} de {TOTAL_STEPS}</p>
        </div>
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Sair
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Step Labels */}
      <div className="flex border-b border-gray-100">
        {['Informações', 'Conteúdo', 'Fotos', 'Preços'].map((label, i) => (
          <div
            key={i}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wide transition-colors ${
              step === i + 1 ? 'text-emerald-600 border-b-2 border-emerald-500' : step > i + 1 ? 'text-gray-400' : 'text-gray-300'
            }`}
          >
            {step > i + 1 ? <Check size={14} className="inline mr-1" /> : null}{label}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }}>
        <div className="p-8 min-h-[420px]">

          {/* STEP 1 — Informações Básicas */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Passeio *</label>
                  <input {...register('name')} className="w-full border p-3 rounded-lg" placeholder="Ex: Cataratas do Iguaçu — Tour Completo" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                  <select {...register('categoryId')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="">Selecione...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Fornecedor</label>
                  <select {...register('supplierId')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="">Selecione...</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={14} /> Duração *</label>
                  <input {...register('duration')} className="w-full border p-3 rounded-lg" placeholder="Ex: 4 horas, Dia inteiro" />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Localização</label>
                  <input {...register('location')} className="w-full border p-3 rounded-lg" placeholder="Ex: Foz do Iguaçu" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Comercial *</label>
                  <textarea {...register('description')} className="w-full border p-3 rounded-lg h-28" placeholder="Descreva o que o cliente vai vivenciar..." />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Languages size={14} /> Idiomas do Guia</label>
                  <div className="flex flex-wrap gap-2">
                    {GUIDE_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          guideLanguages.includes(lang)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Ponto de Encontro</label>
                  <input {...register('meetingPoint')} className="w-full border p-3 rounded-lg" placeholder="Ex: Portão Principal do Parque, Estacionamento A" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Conteúdo / Itinerário */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Conteúdo e Itinerário</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* O que inclui */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Check size={14} className="text-green-600" /> O que inclui</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tempFeature} onChange={(e) => setTempFeature(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('features', tempFeature, () => setTempFeature('')); } }} className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Motorista bilíngue, Seguro..." />
                    <button type="button" onClick={() => addToArray('features', tempFeature, () => setTempFeature(''))} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200 text-sm font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((f, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {f} <X size={12} className="cursor-pointer" onClick={() => removeFromArray('features', i)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Não inclui */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><X size={14} className="text-red-600" /> Não inclui</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tempNotIncluded} onChange={(e) => setTempNotIncluded(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('notIncluded', tempNotIncluded, () => setTempNotIncluded('')); } }} className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Pedágio, Taxa extra..." />
                    <button type="button" onClick={() => addToArray('notIncluded', tempNotIncluded, () => setTempNotIncluded(''))} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200 text-sm font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notIncluded.map((item, i) => (
                      <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {item} <X size={12} className="cursor-pointer" onClick={() => removeFromArray('notIncluded', i)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Tag size={14} className="text-primary-600" /> Tags (Selos no Card)</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tempTag} onChange={(e) => setTempTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('tags', tempTag, () => setTempTag('')); } }} className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ex: Imperdível, Família, Aventura..." />
                    <button type="button" onClick={() => addToArray('tags', tempTag, () => setTempTag(''))} className="bg-gray-100 px-3 rounded-lg hover:bg-gray-200 text-sm font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        {tag} <X size={12} className="cursor-pointer" onClick={() => removeFromArray('tags', i)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Itinerário */}
                <div className="col-span-2 border-t pt-5">
                  <h3 className="font-bold text-gray-700 mb-3">Itinerário (Opcional)</h3>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <input value={tempItinerary.time} onChange={(e) => setTempItinerary({ ...tempItinerary, time: e.target.value })} className="border p-2 rounded text-sm" placeholder="Horário (Ex: 08:00)" />
                    <input value={tempItinerary.title} onChange={(e) => setTempItinerary({ ...tempItinerary, title: e.target.value })} className="border p-2 rounded text-sm" placeholder="Título da Etapa *" />
                    <input value={tempItinerary.description} onChange={(e) => setTempItinerary({ ...tempItinerary, description: e.target.value })} className="border p-2 rounded text-sm" placeholder="Descrição breve" />
                  </div>
                  <button type="button" onClick={addItinerary} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-primary-700">
                    <Plus size={14} /> Adicionar Etapa
                  </button>
                  <div className="mt-3 space-y-2">
                    {itinerary.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 border rounded-lg px-3 py-2">
                        {item.time && <span className="text-xs font-bold text-gray-500 w-14 shrink-0">{item.time}</span>}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">{item.title}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </div>
                        <button type="button" onClick={() => setItinerary((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Fotos */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Fotos e Galeria</h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Foto de Capa *</label>
                <div className="w-40 h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                  {imageUrl
                    ? <img src={imageUrl} className="w-full h-full object-cover" alt="Capa" />
                    : <div className="flex flex-col items-center justify-center h-full text-gray-400"><ImageIcon size={32} /><span className="text-xs mt-1">Capa</span></div>
                  }
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Galeria</label>
                <div className="flex flex-wrap gap-3">
                  {gallery.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setValue('gallery', gallery.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold mt-1">Adicionar</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Preços */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Preços e Operação</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço Base *</label>
                  <Controller name="price" control={control} render={({ field }) => (
                    <CurrencyInput value={field.value || 0} onChange={field.onChange} className="w-full border p-3 rounded-lg font-bold text-green-700 text-lg" />
                  )} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço "De" — Riscado</label>
                  <Controller name="compareAtPrice" control={control} render={({ field }) => (
                    <CurrencyInput value={field.value || 0} onChange={field.onChange} className="w-full border p-3 rounded-lg" />
                  )} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Custo Fornecedor</label>
                  <Controller name="costPrice" control={control} render={({ field }) => (
                    <CurrencyInput value={field.value || 0} onChange={field.onChange} className="w-full border p-3 rounded-lg text-red-600" />
                  )} />
                </div>
              </div>

              {/* Variações de Tarifa — Duas seções lado a lado */}
              <div className="border-t pt-5">
                <p className="text-xs text-gray-500 mb-5">O menor preço entre todas as variações será exibido como "A partir de" no card. Preencha uma ou ambas as seções.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* ── REGULAR (Por Pessoa) ── */}
                  <div className="border-2 border-emerald-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2 border-b border-emerald-200">
                      <Users size={18} className="text-emerald-600" />
                      <span className="font-bold text-emerald-800 text-sm">Regular — Por Pessoa</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <input value={tempTierRegular.name} onChange={(e) => setTempTierRegular({ ...tempTierRegular, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Ex: Adulto, Criança 6-12 anos" />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Venda</label>
                            <CurrencyInput value={tempTierRegular.price} onChange={(v) => setTempTierRegular({ ...tempTierRegular, price: v })} className="w-full border p-2 rounded text-sm" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Custo</label>
                            <CurrencyInput value={tempTierRegular.costPrice} onChange={(v) => setTempTierRegular({ ...tempTierRegular, costPrice: v })} className="w-full border p-2 rounded text-sm" />
                          </div>
                        </div>
                        <button type="button" onClick={() => addTier('per_person')} className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 text-sm flex items-center justify-center gap-1">
                          <Plus size={14} /> Adicionar Tarifa
                        </button>
                      </div>
                      <div className="space-y-2 mt-3">
                        {pricingTiers.filter(t => !t.mode || t.mode === 'per_person').map((tier, i) => (
                          <div key={tier.id} className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg">
                            <div>
                              <span className="font-bold text-gray-800 text-sm">{tier.name}</span>
                              <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                                <span>Venda: <b className="text-green-600">{formatCurrency(tier.price)}</b></span>
                                <span>Custo: <b className="text-red-500">{formatCurrency(tier.costPrice || 0)}</b></span>
                              </div>
                            </div>
                            <button type="button" onClick={() => setPricingTiers((prev) => prev.filter((t) => t.id !== tier.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {pricingTiers.filter(t => !t.mode || t.mode === 'per_person').length === 0 && (
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
                        <input value={tempTierPrivate.name} onChange={(e) => setTempTierPrivate({ ...tempTierPrivate, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Ex: Carro até 4 pax, Van até 15 pax" />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Venda</label>
                            <CurrencyInput value={tempTierPrivate.price} onChange={(v) => setTempTierPrivate({ ...tempTierPrivate, price: v })} className="w-full border p-2 rounded text-sm" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Custo</label>
                            <CurrencyInput value={tempTierPrivate.costPrice} onChange={(v) => setTempTierPrivate({ ...tempTierPrivate, costPrice: v })} className="w-full border p-2 rounded text-sm" />
                          </div>
                        </div>
                        <button type="button" onClick={() => addTier('per_vehicle')} className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 text-sm flex items-center justify-center gap-1">
                          <Plus size={14} /> Adicionar Veículo
                        </button>
                      </div>
                      <div className="space-y-2 mt-3">
                        {pricingTiers.filter(t => t.mode === 'per_vehicle').map((tier, i) => (
                          <div key={tier.id} className="flex justify-between items-center bg-primary-50/50 border border-primary-100 p-2.5 rounded-lg">
                            <div>
                              <span className="font-bold text-gray-800 text-sm">{tier.name}</span>
                              <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                                <span>Venda: <b className="text-green-600">{formatCurrency(tier.price)}</b></span>
                                <span>Custo: <b className="text-red-500">{formatCurrency(tier.costPrice || 0)}</b></span>
                              </div>
                            </div>
                            <button type="button" onClick={() => setPricingTiers((prev) => prev.filter((t) => t.id !== tier.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {pricingTiers.filter(t => t.mode === 'per_vehicle').length === 0 && (
                          <p className="text-xs text-gray-400 italic text-center py-2">Nenhuma tarifa por veículo</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avaliação */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Avaliação (opcional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nota (0–10)</label>
                    <Controller name="rating" control={control} render={({ field }) => (
                      <input
                        type="number" step="0.1" min="0" max="10"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        className="w-full border p-3 rounded-lg"
                        placeholder="Ex: 9.5 — deixe vazio para Novo Produto"
                      />
                    )} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nº de Avaliações</label>
                    <Controller name="reviewsCount" control={control} render={({ field }) => (
                      <input
                        type="number" min="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        className="w-full border p-3 rounded-lg"
                        placeholder="Ex: 128"
                      />
                    )} />
                  </div>
                </div>
              </div>

              {/* Configurações Gerais */}
              <div className="border-t pt-5 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Controller name="is_free_cancellation" control={control} render={({ field }) => (
                    <input type="checkbox" checked={field.value ?? false} onChange={field.onChange} className="w-5 h-5 accent-green-600" />
                  )} />
                  <span className="text-sm font-bold text-gray-700">Cancelamento Gratuito</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Controller name="isFeatured" control={control} render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-primary-600" />
                  )} />
                  <span className="text-sm font-bold text-gray-700">Destaque na Home</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Controller name="active" control={control} render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-primary-600" />
                  )} />
                  <span className="text-sm font-bold text-gray-700">Produto Ativo</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Anterior
          </button>

          {step < TOTAL_STEPS ? (
            <button key="next" type="button" onClick={advanceStep} className="bg-primary-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700">
              Próximo <ArrowRight size={18} />
            </button>
          ) : (
            <button key="submit" type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:opacity-60">
              {loading ? 'Salvando...' : <><Save size={18} /> Finalizar Cadastro</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
