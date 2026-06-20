'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import {
  agendaPaxSchema,
  AgendaPaxFormData,
  AgendaServiceData,
} from './serviceOrderSchema';
import type { Vehicle, DriverGuide } from '@/app/types';
import { useCompanyInfo } from './useCompanyInfo';
import {
  ArrowLeft, ArrowRight, Save, Check, Plus, Trash2,
  ClipboardList, Calendar, MapPin, Users, UserCheck,
  Eye, Mail, Download, Plane, Building2,
} from 'lucide-react';

// PDF (static imports)
import { pdf } from '@react-pdf/renderer';
import { PassengerAgendaTemplate } from '@/components/PDF/PassengerAgendaTemplate';
import { WelcomeDocTemplate } from '@/components/PDF/WelcomeDocTemplate';

const STEPS = ['Titular e Hospedagem', 'Cronograma de Serviços', 'Guia', 'Revisão'];

const SERVICE_TYPE_LABELS: Record<string, string> = {
  transfer_in: 'Transfer IN',
  transfer_out: 'Transfer OUT',
  tour: 'Tour / Passeio',
  excursion: 'Excursão',
  other: 'Outro',
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  transfer_in: 'bg-primary-100 text-primary-800',
  transfer_out: 'bg-orange-100 text-orange-800',
  tour: 'bg-emerald-100 text-emerald-800',
  excursion: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-700',
};

interface AgendaPaxWizardProps {
  initialData?: any;
  mode: 'create' | 'edit';
}

export default function AgendaPaxWizard({ initialData, mode }: AgendaPaxWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const company = useCompanyInfo();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialData?.id || null);

  // Lookups
  const [guides, setGuides] = useState<DriverGuide[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Services (managed outside RHF)
  const [services, setServices] = useState<(AgendaServiceData & { assigned_vehicle_id?: string })[]>([]);
  const [tempService, setTempService] = useState<AgendaServiceData & { assigned_vehicle_id?: string }>({
    data_servico: '', hora_apresentacao: '', nome_servico: '', tipo: 'REGULAR',
    service_type: 'tour', voo_info: '', observacao: '', assigned_vehicle_id: '',
  });

  // PDF
  const [pdfLang, setPdfLang] = useState<'pt' | 'en' | 'es'>('pt');

  const {
    register, handleSubmit, trigger, watch, getValues,
    formState: { errors },
  } = useForm<AgendaPaxFormData>({
    resolver: zodResolver(agendaPaxSchema),
    defaultValues: {
      venda_id: initialData?.os_number || '',
      cliente_titular: initialData?.lead_passenger_name || '',
      agencia: initialData?.agency_name || '',
      hotel: initialData?.hotel_name || '',
      pax_adt: initialData?.pax_count || 1,
      pax_chd: initialData?.children_count || 0,
      pax_inf: 0,
      pax_sen: 0,
      date_in: initialData?.date_in || '',
      date_out: initialData?.date_out || '',
      contato_emergencia: '',
      notes: '',
      assigned_guide_id: '',
    },
  });

  const watchedData = watch();

  useEffect(() => {
    const load = async () => {
      const [{ data: g }, { data: v }] = await Promise.all([
        supabase.from('drivers_guides').select('*').eq('status', 'active').order('name'),
        supabase.from('vehicles').select('*').eq('status', 'active').order('model'),
      ]);
      if (g) setGuides(g);
      if (v) setVehicles(v);
    };
    load();
  }, [supabase]);

  // Service helpers
  const addService = () => {
    if (!tempService.nome_servico.trim() || !tempService.data_servico) return;
    setServices(prev => [...prev, { ...tempService }]);
    setTempService({
      data_servico: tempService.data_servico, hora_apresentacao: '', nome_servico: '', tipo: 'REGULAR',
      service_type: 'tour', voo_info: '', observacao: '', assigned_vehicle_id: '',
    });
  };

  const removeService = (i: number) => setServices(prev => prev.filter((_, idx) => idx !== i));

  const isTransfer = (type?: string) => type === 'transfer_in' || type === 'transfer_out';

  // Step validation
  const STEP_FIELDS: Record<number, (keyof AgendaPaxFormData)[]> = {
    1: ['venda_id', 'cliente_titular', 'hotel', 'pax_adt', 'date_in', 'date_out'],
    2: [],
    3: [],
    4: [],
  };

  const advanceStep = async () => {
    const fields = STEP_FIELDS[step] || [];
    if (fields.length > 0) {
      const valid = await trigger(fields as any);
      if (!valid) return;
    }
    setStep(s => Math.min(STEPS.length, s + 1));
  };

  // Submit
  const onSubmit = async (data: AgendaPaxFormData) => {
    setLoading(true);
    try {
      const totalPax = (data.pax_adt || 0) + (data.pax_chd || 0) + (data.pax_inf || 0) + (data.pax_sen || 0);

      // Dados extras serializados em notes (tabela não tem coluna metadata)
      const extra = JSON.stringify({
        pax_breakdown: {
          adt: data.pax_adt,
          chd: data.pax_chd || 0,
          inf: data.pax_inf || 0,
          sen: data.pax_sen || 0,
        },
        contato_emergencia: data.contato_emergencia || null,
        user_notes: data.notes || '',
      });

      const payload: Record<string, any> = {
        doc_type: 'agenda',
        os_number: data.venda_id,
        agency_name: data.agencia || null,
        reference_code: null,
        lead_passenger_name: data.cliente_titular,
        pax_count: data.pax_adt + (data.pax_sen || 0),
        children_count: (data.pax_chd || 0) + (data.pax_inf || 0),
        date_in: data.date_in,
        date_out: data.date_out,
        hotel_name: data.hotel,
        assigned_guide_id: data.assigned_guide_id || null,
        notes: extra,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      };

      let osId = savedId;

      if (mode === 'create' || !osId) {
        const { data: newOS, error } = await supabase.from('service_orders').insert([payload]).select().single();
        if (error) throw error;
        osId = newOS.id;
        setSavedId(osId);
      } else {
        const { error } = await supabase.from('service_orders').update(payload).eq('id', osId);
        if (error) throw error;
        await supabase.from('service_order_items').delete().eq('service_order_id', osId);
      }

      // Insert service items
      if (services.length > 0) {
        const itemPayload = services.map((s, i) => ({
          service_order_id: osId,
          date: s.data_servico,
          time: s.hora_apresentacao || null,
          service_type: s.service_type || 'tour',
          description: s.nome_servico,
          flight_number: s.voo_info || null,
          assigned_vehicle_id: s.assigned_vehicle_id || null,
          notes: s.observacao ? `[${s.tipo}] ${s.observacao}` : `[${s.tipo}]`,
          sort_order: i,
        }));
        const { error } = await supabase.from('service_order_items').insert(itemPayload);
        if (error) throw error;
      }

      alert('Agenda do Passageiro salva com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // PDF
  const generatePDF = async (type: 'agenda' | 'welcome') => {
    setLoading(true);
    try {
      const data = getValues();
      const guide = guides.find(g => g.id === data.assigned_guide_id);

      const itemsData = services.map(s => ({
        date: s.data_servico,
        time: s.hora_apresentacao,
        serviceType: s.service_type ? (SERVICE_TYPE_LABELS[s.service_type] || s.service_type) : s.tipo,
        description: s.nome_servico,
        flightNumber: s.voo_info,
        notes: s.observacao,
      }));

      if (type === 'agenda') {
        const pdfData = {
          companyName: company.company_name,
          leadPassengerName: data.cliente_titular,
          paxCount: data.pax_adt + (data.pax_sen || 0),
          childrenCount: (data.pax_chd || 0) + (data.pax_inf || 0),
          hotelName: data.hotel,
          agencyName: data.agencia,
          referenceCode: '',
          dateIn: data.date_in,
          dateOut: data.date_out,
          osNumber: data.venda_id,
          guideName: guide?.name,
          guidePhone: guide?.phone,
          observations: data.notes,
          items: itemsData,
        };
        const blob = await pdf(<PassengerAgendaTemplate data={pdfData} lang={pdfLang} />).toBlob();
        downloadBlob(blob, `Agenda-${data.cliente_titular.replace(/\s/g, '_')}.pdf`);
      } else {
        const pdfData = {
          companyName: company.company_name,
          leadPassengerName: data.cliente_titular,
          paxCount: data.pax_adt + (data.pax_sen || 0),
          dateIn: data.date_in,
          dateOut: data.date_out,
          hotelName: data.hotel,
          guideName: guide?.name,
          guidePhone: guide?.phone,
          items: itemsData.map(it => ({
            ...it,
            pickUp: '',
            dropOff: '',
            flightTime: '',
          })),
        };
        const blob = await pdf(<WelcomeDocTemplate data={pdfData} lang={pdfLang} />).toBlob();
        downloadBlob(blob, `Welcome-${data.cliente_titular.replace(/\s/g, '_')}.pdf`);
      }
    } catch (err: any) {
      alert('Erro ao gerar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-teal-50 border-b border-teal-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900 flex items-center gap-2">
            <ClipboardList size={24} /> {mode === 'create' ? 'Nova Agenda do Passageiro' : 'Editar Agenda'}
          </h1>
          <p className="text-teal-700 text-sm mt-1">Passo {step} de {STEPS.length}</p>
        </div>
        <button onClick={() => router.push('/admin/operations')} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>

      {/* Step Labels */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {STEPS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { if (i + 1 < step) setStep(i + 1); }}
            className={`flex-1 min-w-[120px] py-3 text-center text-xs font-bold uppercase tracking-wide transition-colors ${
              step === i + 1 ? 'text-teal-600 border-b-2 border-teal-500'
                : step > i + 1 ? 'text-gray-400 cursor-pointer hover:text-teal-400' : 'text-gray-300'
            }`}
          >
            {step > i + 1 ? <Check size={14} className="inline mr-1" /> : null}{label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 md:p-8 min-h-[480px]">

          {/* ═══ STEP 1: Titular e Hospedagem ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} /> Dados do Titular e Hospedagem
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nº Venda / OS *</label>
                  <input {...register('venda_id')} className="w-full border p-3 rounded-lg" placeholder="Ex: 357.686" />
                  {errors.venda_id && <p className="text-red-500 text-xs mt-1">{errors.venda_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Passageiro Titular *</label>
                  <input {...register('cliente_titular')} className="w-full border p-3 rounded-lg" placeholder="Nome completo" />
                  {errors.cliente_titular && <p className="text-red-500 text-xs mt-1">{errors.cliente_titular.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Agência</label>
                  <input {...register('agencia')} className="w-full border p-3 rounded-lg" placeholder="Ex: FRT OPERADORA" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hotel *</label>
                  <input {...register('hotel')} className="w-full border p-3 rounded-lg" placeholder="Ex: LOI SUITES" />
                  {errors.hotel && <p className="text-red-500 text-xs mt-1">{errors.hotel.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data IN *</label>
                  <input type="date" {...register('date_in')} className="w-full border p-3 rounded-lg" />
                  {errors.date_in && <p className="text-red-500 text-xs mt-1">{errors.date_in.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data OUT *</label>
                  <input type="date" {...register('date_out')} className="w-full border p-3 rounded-lg" />
                  {errors.date_out && <p className="text-red-500 text-xs mt-1">{errors.date_out.message}</p>}
                </div>
              </div>

              {/* Pax Breakdown */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quantidade de Passageiros</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                    <label className="block text-xs font-bold text-teal-700 mb-1">Adultos *</label>
                    <input type="number" min={1} {...register('pax_adt', { valueAsNumber: true })} className="w-full border p-2 rounded-lg text-center text-lg font-bold" />
                    {errors.pax_adt && <p className="text-red-500 text-xs mt-1">{errors.pax_adt.message}</p>}
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-center">
                    <label className="block text-xs font-bold text-primary-700 mb-1">Crianças (CHD)</label>
                    <input type="number" min={0} {...register('pax_chd', { valueAsNumber: true })} className="w-full border p-2 rounded-lg text-center text-lg font-bold" />
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                    <label className="block text-xs font-bold text-purple-700 mb-1">Infantes (INF)</label>
                    <input type="number" min={0} {...register('pax_inf', { valueAsNumber: true })} className="w-full border p-2 rounded-lg text-center text-lg font-bold" />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <label className="block text-xs font-bold text-amber-700 mb-1">Seniores (SEN)</label>
                    <input type="number" min={0} {...register('pax_sen', { valueAsNumber: true })} className="w-full border p-2 rounded-lg text-center text-lg font-bold" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contato de Emergência</label>
                  <input {...register('contato_emergencia')} className="w-full border p-3 rounded-lg" placeholder="Telefone ou WhatsApp" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
                  <input {...register('notes')} className="w-full border p-3 rounded-lg" placeholder="Observações para o passageiro..." />
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Cronograma de Serviços ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={20} /> Cronograma de Serviços
              </h2>

              {/* Add Service */}
              <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Data *</label>
                    <input
                      type="date"
                      value={tempService.data_servico}
                      onChange={e => setTempService({ ...tempService, data_servico: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Hora Apresentação</label>
                    <input
                      type="time"
                      value={tempService.hora_apresentacao || ''}
                      onChange={e => setTempService({ ...tempService, hora_apresentacao: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tipo Serviço</label>
                    <select
                      value={tempService.service_type || 'tour'}
                      onChange={e => setTempService({ ...tempService, service_type: e.target.value as any })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Modalidade</label>
                    <select
                      value={tempService.tipo}
                      onChange={e => setTempService({ ...tempService, tipo: e.target.value as any })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="PRIVATIVO">Privativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nome do Serviço *</label>
                  <input
                    value={tempService.nome_servico}
                    onChange={e => setTempService({ ...tempService, nome_servico: e.target.value })}
                    className="w-full border p-2.5 rounded-lg text-sm"
                    placeholder="Ex: BY NIGHT ARGENTINA TRANSFER"
                  />
                </div>

                {/* Transfer fields */}
                {isTransfer(tempService.service_type) && (
                  <div className="bg-primary-50/50 p-3 rounded-lg border border-primary-100">
                    <label className="block text-xs font-bold text-primary-700 mb-1 flex items-center gap-1"><Plane size={12} /> Informações do Voo</label>
                    <input
                      value={tempService.voo_info || ''}
                      onChange={e => setTempService({ ...tempService, voo_info: e.target.value })}
                      className="w-full border p-2 rounded-lg text-sm"
                      placeholder="Ex: LATAM LA3680 - 14:25"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Observação</label>
                  <input
                    value={tempService.observacao || ''}
                    onChange={e => setTempService({ ...tempService, observacao: e.target.value })}
                    className="w-full border p-2.5 rounded-lg text-sm"
                    placeholder="Nota adicional para este serviço..."
                  />
                </div>

                <button
                  type="button"
                  onClick={addService}
                  className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-teal-700"
                >
                  <Plus size={14} /> Adicionar Serviço
                </button>
              </div>

              {/* Services List — chronological */}
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services
                    .sort((a, b) => `${a.data_servico}${a.hora_apresentacao}`.localeCompare(`${b.data_servico}${b.hora_apresentacao}`))
                    .map((s, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-center shrink-0 min-w-[70px]">
                        <p className="text-xs font-bold text-gray-400">{formatDate(s.data_servico)}</p>
                        {s.hora_apresentacao && <p className="text-lg font-black text-teal-700">{s.hora_apresentacao}</p>}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${SERVICE_TYPE_COLORS[s.service_type || 'tour']}`}>
                            {SERVICE_TYPE_LABELS[s.service_type || 'tour']}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.tipo === 'PRIVATIVO' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                            {s.tipo}
                          </span>
                          <span className="text-sm font-bold text-gray-800">{s.nome_servico}</span>
                        </div>
                        {s.voo_info && <p className="text-xs text-primary-600 flex items-center gap-1"><Plane size={11} /> {s.voo_info}</p>}
                        {s.observacao && <p className="text-xs text-gray-500">{s.observacao}</p>}
                      </div>
                      <button type="button" onClick={() => removeService(i)} className="text-red-400 hover:text-red-600 mt-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm italic">Nenhum serviço adicionado ao cronograma.</p>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Guia ═══ */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck size={20} /> Guia Responsável
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <label className="block text-sm font-bold text-gray-700 mb-3">Guia / Acompanhante</label>
                <select
                  {...register('assigned_guide_id')}
                  className="w-full border p-3 rounded-lg bg-white text-sm"
                >
                  <option value="">Selecione...</option>
                  {guides.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.type === 'guide' ? 'Guia' : g.type === 'driver' ? 'Motorista' : 'Ambos'})
                      {g.phone ? ` — ${g.phone}` : ''}
                    </option>
                  ))}
                </select>

                {watchedData.assigned_guide_id && (() => {
                  const g = guides.find(x => x.id === watchedData.assigned_guide_id);
                  if (!g) return null;
                  return (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-teal-200">
                      <p className="font-bold text-teal-700">{g.name}</p>
                      {g.phone && <p className="text-sm text-gray-600">WhatsApp: {g.phone}</p>}
                      {g.languages_spoken?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {g.languages_spoken.map((l, i) => (
                            <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{l}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Revisão ═══ */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Eye size={20} /> Revisão — Agenda do Passageiro</h2>

              {/* Empresa */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                <Building2 size={20} className="text-teal-600" />
                <div>
                  <p className="font-bold text-teal-800">{company.company_name}</p>
                  <p className="text-xs text-gray-600">
                    CNPJ: {company.cnpj_formatted} | {company.phone} | {company.contact_email}
                  </p>
                  <p className="text-xs text-gray-500">{company.address}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-teal-600 uppercase mb-1">Passageiro Titular</p>
                  <p className="text-lg font-black text-teal-800">{watchedData.cliente_titular}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {watchedData.pax_adt} ADT
                    {(watchedData.pax_chd || 0) > 0 ? `, ${watchedData.pax_chd} CHD` : ''}
                    {(watchedData.pax_inf || 0) > 0 ? `, ${watchedData.pax_inf} INF` : ''}
                    {(watchedData.pax_sen || 0) > 0 ? `, ${watchedData.pax_sen} SEN` : ''}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Período</p>
                  <p className="text-sm font-bold text-gray-800">{formatDate(watchedData.date_in)} — {formatDate(watchedData.date_out)}</p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><MapPin size={12} /> {watchedData.hotel}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Agência / Venda</p>
                  <p className="text-sm font-bold text-gray-800">{watchedData.agencia || '-'}</p>
                  <p className="text-sm text-gray-600 mt-1">OS: {watchedData.venda_id}</p>
                </div>
              </div>

              {/* Guide */}
              {watchedData.assigned_guide_id && (() => {
                const g = guides.find(x => x.id === watchedData.assigned_guide_id);
                if (!g) return null;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <UserCheck size={20} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-800">{g.name}</p>
                      <p className="text-sm text-emerald-600">{g.phone || 'Sem telefone'}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Service Timeline */}
              {services.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Cronograma ({services.length} serviços)</h3>
                  <div className="space-y-2">
                    {services
                      .sort((a, b) => `${a.data_servico}${a.hora_apresentacao}`.localeCompare(`${b.data_servico}${b.hora_apresentacao}`))
                      .map((s, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                        <div className="text-center shrink-0 min-w-[70px]">
                          <p className="text-xs font-bold text-gray-400">{formatDate(s.data_servico)}</p>
                          {s.hora_apresentacao && <p className="text-lg font-black text-gray-700">{s.hora_apresentacao}</p>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${SERVICE_TYPE_COLORS[s.service_type || 'tour']}`}>
                              {SERVICE_TYPE_LABELS[s.service_type || 'tour']}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.tipo === 'PRIVATIVO' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                              {s.tipo}
                            </span>
                            <span className="text-sm font-bold text-gray-800">{s.nome_servico}</span>
                          </div>
                          {s.voo_info && <p className="text-xs text-primary-600 mt-1"><Plane size={11} className="inline" /> {s.voo_info}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {watchedData.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">Observações</p>
                  <p className="text-sm text-gray-700">{watchedData.notes}</p>
                </div>
              )}

              {/* PDF */}
              {savedId && (
                <div className="border-t border-gray-200 pt-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Gerar Documento</h3>
                  <div className="border-2 border-teal-200 bg-teal-50 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={pdfLang}
                        onChange={e => setPdfLang(e.target.value as any)}
                        className="border border-teal-300 rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="pt">Português</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => generatePDF('agenda')}
                        disabled={loading}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50"
                      >
                        <Download size={14} /> Agenda PAX
                      </button>
                      <button
                        type="button"
                        onClick={() => generatePDF('welcome')}
                        disabled={loading}
                        className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-600 disabled:opacity-50"
                      >
                        <Download size={14} /> Doc. Chegada
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <ArrowLeft size={16} className="inline mr-1" /> Anterior
          </button>

          {step < STEPS.length ? (
            <button type="button" onClick={advanceStep} className="bg-teal-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-700">
              Próximo <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:opacity-60">
              {loading ? 'Salvando...' : <><Save size={18} /> Salvar Agenda</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
