'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { airportTransferSchema, AirportTransferFormData } from './schemas';
import { TransferRoute, PricingTier, Supplier, Product } from '@/app/types';
import { REGIONAL_AIRPORTS } from '@/app/lib/productUtils';
import {
  ArrowLeft, ArrowRight, Save, Check, X, Upload, Plus, Trash2,
  Plane, Users, Luggage, Tag, Image as ImageIcon, MapPin, Clock,
  ArrowRightLeft, Car,
} from 'lucide-react';
import CurrencyInput from '../CurrencyInput';
import { formatCurrency } from '@/app/lib/productUtils';

interface AirportTransferWizardProps {
  initialData?: Product | null;
  mode: 'create' | 'edit';
}

const TOTAL_STEPS = 4;

const STEP_FIELDS: Record<number, (keyof AirportTransferFormData)[]> = {
  1: ['name', 'airportCode', 'routeType'],
  2: ['serviceType', 'vehicleModel', 'passengerCapacity'],
  3: [],
  4: ['price'],
};

const VEHICLE_MODELS = [
  'Sedan (Toyota Corolla, Nissan Sentra)',
  'SUV (Toyota SW4, Mitsubishi Pajero)',
  'Van Executiva (Sprinter, H1)',
  'Micro-ônibus (8–15 lugares)',
  'Ônibus (16+ lugares)',
  'Minivan (Dodge Grand Caravan)',
];

export default function AirportTransferWizard({ initialData, mode }: AirportTransferWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Trechos (Routes) — gerenciados separadamente
  const [routes, setRoutes] = useState<TransferRoute[]>(
    initialData?.transferDetails?.routes || [],
  );
  const [tempRoute, setTempRoute] = useState<Partial<TransferRoute>>({
    originType: 'airport',
    originName: '',
    originCode: '',
    destinationType: 'zone',
    destinationName: '',
  });

  // Tiers de preço
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    initialData?.pricingTiers || [],
  );
  const [tempTierRegular, setTempTierRegular] = useState({ name: '', price: 0, costPrice: 0 });
  const [tempTierPrivate, setTempTierPrivate] = useState({ name: '', price: 0, costPrice: 0 });

  // Temp arrays
  const [tempTag, setTempTag] = useState('');
  const [tempFeature, setTempFeature] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AirportTransferFormData>({
    resolver: zodResolver(airportTransferSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      supplierId: initialData?.supplierId || '',
      airportCode: initialData?.transferDetails?.airportCode || 'IGU',
      routeType: initialData?.transferDetails?.routeType || 'airport_to_hotel',
      supportsRoundtrip: initialData?.transferDetails?.supportsRoundtrip ?? true,
      roundtripDiscountPercent: initialData?.transferDetails?.roundtripDiscountPercent ?? 0,
      serviceType: initialData?.transferDetails?.serviceType || 'private',
      pricingModel: initialData?.transferDetails?.pricingModel || 'per_vehicle',
      vehicleModel: initialData?.transferDetails?.vehicleModel || '',
      passengerCapacity: initialData?.transferDetails?.passengerCapacity || 4,
      luggageCapacity: initialData?.transferDetails?.luggageCapacity || 2,
      handLuggageCapacity: initialData?.transferDetails?.handLuggageCapacity ?? 4,
      requiresFlightNumber: initialData?.transferDetails?.requiresFlightNumber ?? true,
      meetingPointInstructions: initialData?.transferDetails?.meetingPointInstructions || '',
      waitingTime: initialData?.transferDetails?.waitingTime || 'Até 60 min após o pouso',
      imageUrl: initialData?.imageUrl || '',
      gallery: initialData?.gallery || [],
      tags: initialData?.tags || [],
      features: initialData?.features || [],
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice,
      costPrice: initialData?.costPrice,
      is_free_cancellation: initialData?.is_free_cancellation ?? true,
      active: initialData?.active ?? true,
      isFeatured: initialData?.isFeatured ?? false,
      rating: initialData?.rating ?? null,
      reviewsCount: initialData?.reviewsCount ?? null,
    },
  });

  const tags = watch('tags');
  const features = watch('features');
  const gallery = watch('gallery') || [];
  const imageUrl = watch('imageUrl');
  const supportsRoundtrip = watch('supportsRoundtrip');
  const airportCode = watch('airportCode');

  useEffect(() => {
    supabase
      .from('suppliers')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => { if (data) setSuppliers(data as Supplier[]); });
  }, [supabase]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || !files.length) return;
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
      if (isGallery) setValue('gallery', [...gallery, ...urls]);
      else setValue('imageUrl', urls[0]);
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (!tempTag.trim()) return;
    setValue('tags', [...tags, tempTag.trim()]);
    setTempTag('');
  };

  const addFeature = () => {
    if (!tempFeature.trim()) return;
    setValue('features', [...features, tempFeature.trim()]);
    setTempFeature('');
  };

  const addRoute = () => {
    if (!tempRoute.originName || !tempRoute.destinationName) {
      alert('Informe origem e destino do trecho.');
      return;
    }
    setRoutes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        originType: tempRoute.originType || 'airport',
        originName: tempRoute.originName!,
        originCode: tempRoute.originCode,
        destinationType: tempRoute.destinationType || 'zone',
        destinationName: tempRoute.destinationName!,
        destinationZoneId: tempRoute.destinationZoneId,
      },
    ]);
    setTempRoute({ originType: 'airport', originName: '', originCode: airportCode, destinationType: 'zone', destinationName: '' });
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

  const onSubmit = async (data: AirportTransferFormData) => {
    setLoading(true);
    try {
      const minTierPrice =
        pricingTiers.length > 0 ? Math.min(...pricingTiers.map((t) => t.price)) : data.price;
      const basePrice = Math.min(data.price, minTierPrice);

      const slug =
        initialData?.slug ||
        (data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w-]+/g, '-') +
          '-' +
          Math.random().toString(36).substring(2, 8));

      const payload = {
        title: data.name,
        slug,
        description: data.description || '',
        price: basePrice,
        cost_price: data.costPrice ?? null,
        compare_at_price: data.compareAtPrice ?? null,
        supplier_id: data.supplierId || null,
        is_fixed_time: false,
        images: gallery.length ? gallery : data.imageUrl ? [data.imageUrl] : [],
        availability: data.active,
        featured: data.isFeatured,
        includes: data.features || [],
        cancellation_policy: '',
        important_info: '',
        rating: data.rating ?? null,
        reviews_count: data.reviewsCount ?? null,
        updated_at: new Date().toISOString(),
        metadata: {
          type: 'transfer',
          tags: data.tags,
          features: data.features,
          is_free_cancellation: data.is_free_cancellation,
          pricingTiers,
          transferDetails: {
            transferCategory: 'airport',
            serviceType: data.serviceType,
            pricingModel: data.pricingModel,
            vehicleModel: data.vehicleModel,
            passengerCapacity: data.passengerCapacity,
            luggageCapacity: data.luggageCapacity,
            handLuggageCapacity: data.handLuggageCapacity,
            requiresFlightNumber: data.requiresFlightNumber,
            meetingPointInstructions: data.meetingPointInstructions,
            waitingTime: data.waitingTime,
            airportCode: data.airportCode,
            routeType: data.routeType,
            supportsRoundtrip: data.supportsRoundtrip,
            roundtripDiscountPercent: data.roundtripDiscountPercent,
            routes,
          },
        },
      };

      if (mode === 'create') {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', initialData?.id);
        if (error) throw error;
      }

      alert('Transfer salvo com sucesso!');
      window.location.href = '/admin/products';
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane size={22} className="text-purple-600" />
            {mode === 'create' ? 'Cadastrar Transfer Aeroporto' : `Editar: ${initialData?.name}`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Passo {step} de {TOTAL_STEPS}</p>
        </div>
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Sair
        </button>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Step Labels */}
      <div className="flex border-b border-gray-100">
        {['Logística', 'Veículo', 'Fotos', 'Preços'].map((label, i) => (
          <div
            key={i}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wide transition-colors ${
              step === i + 1 ? 'text-purple-600 border-b-2 border-purple-600' : step > i + 1 ? 'text-gray-400' : 'text-gray-300'
            }`}
          >
            {step > i + 1 ? <Check size={14} className="inline mr-1" /> : null}{label}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }}>
        <div className="p-8 min-h-[480px]">

          {/* STEP 1 — Logística */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Informações do Trecho</h2>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Serviço *</label>
                  <input {...register('name')} className="w-full border p-3 rounded-lg" placeholder="Ex: Transfer Aeroporto IGU — Hotéis em Foz do Iguaçu" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Aeroporto Principal *</label>
                  <select {...register('airportCode')} className="w-full border p-3 rounded-lg bg-white">
                    {REGIONAL_AIRPORTS.map((a) => (
                      <option key={a.code} value={a.code}>{a.label}</option>
                    ))}
                    <option value="GRU">GRU — São Paulo (Guarulhos)</option>
                    <option value="GIG">GIG — Rio de Janeiro (Galeão)</option>
                    <option value="BSB">BSB — Brasília</option>
                  </select>
                  {errors.airportCode && <p className="text-red-500 text-xs mt-1">{errors.airportCode.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sentido Padrão</label>
                  <select {...register('routeType')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="airport_to_hotel">Chegada — Aeroporto ao Hotel</option>
                    <option value="hotel_to_airport">Partida — Hotel ao Aeroporto</option>
                    <option value="round_trip">Ida e Volta (In & Out)</option>
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descrição (opcional)</label>
                  <input {...register('description')} className="w-full border p-3 rounded-lg" placeholder="Breve descrição do serviço" />
                </div>
              </div>

              {/* Suporta Ida e Volta */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Controller
                    name="supportsRoundtrip"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="supportsRoundtrip"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 accent-purple-600"
                      />
                    )}
                  />
                  <label htmlFor="supportsRoundtrip" className="font-bold text-purple-900 flex items-center gap-2 cursor-pointer">
                    <ArrowRightLeft size={18} /> Este serviço suporta Ida e Volta (Roundtrip)
                  </label>
                </div>
                {supportsRoundtrip && (
                  <div className="pl-8">
                    <label className="block text-sm font-bold text-purple-800 mb-1">Desconto na Volta (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      {...register('roundtripDiscountPercent', { valueAsNumber: true })}
                      className="w-40 border p-2 rounded-lg"
                      placeholder="Ex: 10"
                    />
                    <p className="text-xs text-purple-600 mt-1">0% = cobra dobro. 10% = 10% de desconto na volta.</p>
                  </div>
                )}
              </div>

              {/* Trechos (Routes) */}
              <div className="border-t pt-5">
                <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><MapPin size={16} className="text-purple-600" /> Trechos Atendidos</h3>
                <p className="text-xs text-gray-500 mb-4">Cadastre as combinações de Origem + Destino que este serviço atende. O motor de busca usa estes dados para filtrar resultados.</p>

                <div className="grid grid-cols-5 gap-2 items-end bg-gray-50 border rounded-xl p-4 mb-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo Origem</label>
                    <select
                      value={tempRoute.originType}
                      onChange={(e) => setTempRoute({ ...tempRoute, originType: e.target.value as any })}
                      className="w-full border p-2 rounded text-sm bg-white"
                    >
                      <option value="airport">Aeroporto</option>
                      <option value="hotel">Hotel</option>
                      <option value="city">Cidade</option>
                      <option value="landmark">Atrativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Nome Origem</label>
                    <input
                      value={tempRoute.originName}
                      onChange={(e) => setTempRoute({ ...tempRoute, originName: e.target.value })}
                      className="w-full border p-2 rounded text-sm"
                      placeholder="Ex: Aeroporto IGU"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Código (IATA)</label>
                    <input
                      value={tempRoute.originCode}
                      onChange={(e) => setTempRoute({ ...tempRoute, originCode: e.target.value.toUpperCase() })}
                      className="w-full border p-2 rounded text-sm uppercase"
                      placeholder="IGU"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Destino</label>
                    <input
                      value={tempRoute.destinationName}
                      onChange={(e) => setTempRoute({ ...tempRoute, destinationName: e.target.value })}
                      className="w-full border p-2 rounded text-sm"
                      placeholder="Ex: Hotéis Centro, Hotel das Cataratas"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addRoute}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-purple-700"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {routes.map((route, i) => (
                    <div key={route.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-2.5 shadow-sm">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{route.originType}</span>
                        <span className="font-medium text-gray-800">{route.originCode ? `${route.originCode} — ` : ''}{route.originName}</span>
                        <ArrowRightLeft size={14} className="text-gray-400" />
                        <span className="text-gray-600">{route.destinationName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRoutes((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {routes.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-3">Nenhum trecho cadastrado. Adicione pelo menos um acima.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Veículo */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Configurações do Veículo</h2>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Serviço</label>
                  <select {...register('serviceType')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="private">Privativo (Apenas o cliente e grupo)</option>
                    <option value="shared">Compartilhado (Shuttle regular)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Modelo de Cobrança</label>
                  <select {...register('pricingModel')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="per_vehicle">Preço fixo pelo veículo inteiro</option>
                    <option value="per_person">Preço por passageiro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Categoria do Veículo *</label>
                  <select {...register('vehicleModel')} className="w-full border p-3 rounded-lg bg-white">
                    <option value="">Selecione...</option>
                    {VEHICLE_MODELS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {errors.vehicleModel && <p className="text-red-500 text-xs mt-1">{errors.vehicleModel.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Users size={14} /> Máx. Passageiros *</label>
                  <input type="number" min={1} {...register('passengerCapacity', { valueAsNumber: true })} className="w-full border p-3 rounded-lg" />
                  {errors.passengerCapacity && <p className="text-red-500 text-xs mt-1">{errors.passengerCapacity.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Luggage size={14} /> Máx. Malas Grandes</label>
                  <input type="number" min={0} {...register('luggageCapacity', { valueAsNumber: true })} className="w-full border p-3 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Máx. Malas de Mão</label>
                  <input type="number" min={0} {...register('handLuggageCapacity', { valueAsNumber: true })} className="w-full border p-3 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={14} /> Tempo de Espera</label>
                  <input {...register('waitingTime')} className="w-full border p-3 rounded-lg" placeholder="Ex: Até 60 min após o pouso" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Instruções de Encontro</label>
                  <textarea {...register('meetingPointInstructions')} className="w-full border p-3 rounded-lg h-20 text-sm" placeholder="Ex: O motorista estará no portão de desembarque com placa com seu nome." />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <Controller
                    name="requiresFlightNumber"
                    control={control}
                    render={({ field }) => (
                      <input type="checkbox" id="requiresFlight" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-purple-600" />
                    )}
                  />
                  <label htmlFor="requiresFlight" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Exigir número do voo no checkout
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Fotos e Apresentação */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Fotos e Apresentação</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Foto de Capa</label>
                  <div className="w-40 h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                    {imageUrl
                      ? <img src={imageUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="flex flex-col items-center justify-center h-full text-gray-400"><ImageIcon size={32} /><span className="text-xs mt-1">Capa</span></div>
                    }
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Galeria</label>
                  <div className="flex flex-wrap gap-2">
                    {gallery.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setValue('gallery', gallery.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 bg-gray-50 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">Add</span>
                      <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Tag size={14} className="text-primary-600" /> Tags (Selos)</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tempTag} onChange={(e) => setTempTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1 border p-2 rounded text-sm" placeholder="Ex: Privativo, Executivo..." />
                    <button type="button" onClick={addTag} className="bg-gray-100 px-3 rounded hover:bg-gray-200 text-sm font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        {tag} <X size={10} className="cursor-pointer" onClick={() => setValue('tags', tags.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Check size={14} className="text-green-600" /> Diferenciais</label>
                  <div className="flex gap-2 mb-2">
                    <input value={tempFeature} onChange={(e) => setTempFeature(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} className="flex-1 border p-2 rounded text-sm" placeholder="Ex: Wi-Fi a bordo, Ar-cond..." />
                    <button type="button" onClick={addFeature} className="bg-gray-100 px-3 rounded hover:bg-gray-200 text-sm font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        {f} <X size={10} className="cursor-pointer" onClick={() => setValue('features', features.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-3">
                  <Controller
                    name="is_free_cancellation"
                    control={control}
                    render={({ field }) => (
                      <input type="checkbox" id="freeCancellation" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-green-600" />
                    )}
                  />
                  <label htmlFor="freeCancellation" className="text-sm font-bold text-gray-700 cursor-pointer">Cancelamento Gratuito</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Preços */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Preços e Variações</h2>
              <p className="text-sm text-gray-500">O menor preço entre as variações será exibido como "A partir de" no card. Se não houver variações, use o preço base.</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço Base *</label>
                  <Controller name="price" control={control} render={({ field }) => (
                    <CurrencyInput value={field.value || 0} onChange={field.onChange} className="w-full border p-3 rounded-lg font-bold text-green-700 text-lg" />
                  )} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço Riscado</label>
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
                        <input value={tempTierRegular.name} onChange={(e) => setTempTierRegular({ ...tempTierRegular, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Ex: Adulto, Criança" />
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
                        {pricingTiers.filter(t => !t.mode || t.mode === 'per_person').map((tier) => (
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
                  <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 px-4 py-3 flex items-center gap-2 border-b border-purple-200">
                      <Car size={18} className="text-purple-600" />
                      <span className="font-bold text-purple-800 text-sm">Privativo — Por Veículo</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <input value={tempTierPrivate.name} onChange={(e) => setTempTierPrivate({ ...tempTierPrivate, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Ex: Sedan 4 pax, Van 7 pax" />
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
                        <button type="button" onClick={() => addTier('per_vehicle')} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 text-sm flex items-center justify-center gap-1">
                          <Plus size={14} /> Adicionar Veículo
                        </button>
                      </div>
                      <div className="space-y-2 mt-3">
                        {pricingTiers.filter(t => t.mode === 'per_vehicle').map((tier) => (
                          <div key={tier.id} className="flex justify-between items-center bg-purple-50/50 border border-purple-100 p-2.5 rounded-lg">
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
              <div className="border-t pt-4">
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

              <div className="border-t pt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller name="isFeatured" control={control} render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-purple-600" />
                  )} />
                  <span className="text-sm font-bold text-gray-700">Destaque na Home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller name="active" control={control} render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 accent-purple-600" />
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
            <button key="next" type="button" onClick={advanceStep} className="bg-purple-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700">
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
