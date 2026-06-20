'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import { serviceOrderSchema, ServiceOrderFormData, PassengerFormData, ServiceItemFormData } from './serviceOrderSchema';
import type { Vehicle, DriverGuide, ServiceOrder } from '@/app/types';
import {
  ArrowLeft, ArrowRight, Save, Check, Plus, Trash2, Copy,
  Plane, Bus, MapPin, Users, FileText, ClipboardList, UserCheck,
  Eye, Mail, Download,
} from 'lucide-react';

// PDF (static imports)
import { pdf } from '@react-pdf/renderer';
import { ServiceOrderTemplate } from '@/components/PDF/ServiceOrderTemplate';
import { PassengerAgendaTemplate } from '@/components/PDF/PassengerAgendaTemplate';
import { WelcomeDocTemplate } from '@/components/PDF/WelcomeDocTemplate';
import { BorderManifestTemplate } from '@/components/PDF/BorderManifestTemplate';

export type DocType = 'os' | 'agenda' | 'manifesto';

interface ServiceOrderWizardProps {
  initialData?: ServiceOrder | null;
  mode: 'create' | 'edit';
  docType: DocType;
}

const DOC_TYPE_CONFIG: Record<DocType, { title: string; color: string; steps: string[] }> = {
  os: {
    title: 'Ordem de Servico',
    color: 'sky',
    steps: ['Dados Gerais', 'Passageiros', 'Itinerario', 'Alocacao', 'Revisao'],
  },
  agenda: {
    title: 'Agenda do Passageiro',
    color: 'teal',
    steps: ['Dados Gerais', 'Passageiros', 'Itinerario', 'Revisao'],
  },
  manifesto: {
    title: 'Manifesto de Fronteira',
    color: 'amber',
    steps: ['Dados Gerais', 'Passageiros', 'Alocacao', 'Revisao'],
  },
};

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

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passaporte',
  rg: 'RG',
  dni: 'DNI',
  other: 'Outro',
};

export default function ServiceOrderWizard({ initialData, mode, docType }: ServiceOrderWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedOsId, setSavedOsId] = useState<string | null>(initialData?.id || null);

  // Lookups
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [guides, setGuides] = useState<DriverGuide[]>([]);
  const [vehicleDriverLinks, setVehicleDriverLinks] = useState<{ vehicle_id: string; driver_id: string }[]>([]);

  // Arrays managed outside RHF
  const [passengers, setPassengers] = useState<PassengerFormData[]>(
    initialData?.passengers?.map(p => ({
      name: p.name,
      birthdate: p.birthdate || '',
      nationality: p.nationality || '',
      document_type: p.document_type || undefined,
      document_number: p.document_number || '',
      gender: p.gender || undefined,
      is_lead: p.is_lead || false,
    })) || []
  );

  const [items, setItems] = useState<(ServiceItemFormData & { assigned_vehicle_id?: string })[]>(
    initialData?.items?.map(it => ({
      date: it.date,
      time: it.time || '',
      service_type: it.service_type,
      description: it.description,
      flight_number: it.flight_number || '',
      flight_time: it.flight_time || '',
      airline_locator: it.airline_locator || '',
      pick_up: it.pick_up || '',
      drop_off: it.drop_off || '',
      assigned_vehicle_id: it.assigned_vehicle_id || '',
      notes: it.notes || '',
    })) || []
  );

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailType, setEmailType] = useState<'os' | 'welcome' | 'manifest' | 'agenda'>('os');
  const [emailLang, setEmailLang] = useState<'pt' | 'en' | 'es'>('pt');

  // Per-document language selector
  const [pdfLang, setPdfLang] = useState<'pt' | 'en' | 'es'>(docType === 'manifesto' ? 'es' : 'pt');

  // Dynamic steps based on docType
  const docConfig = DOC_TYPE_CONFIG[docType];
  const STEP_LABELS = docConfig.steps;
  const TOTAL_STEPS = STEP_LABELS.length;

  // Map logical step index to the actual content step
  // OS: [1=Dados, 2=Pax, 3=Itinerario, 4=Alocacao, 5=Revisao]
  // Agenda: [1=Dados, 2=Pax, 3=Itinerario, 4=Revisao]
  // Manifesto: [1=Dados, 2=Pax, 3=Alocacao, 4=Revisao]
  const getContentStep = (logicalStep: number): 'dados' | 'pax' | 'itinerario' | 'alocacao' | 'revisao' => {
    const label = STEP_LABELS[logicalStep - 1];
    if (label === 'Dados Gerais') return 'dados';
    if (label === 'Passageiros') return 'pax';
    if (label === 'Itinerario') return 'itinerario';
    if (label === 'Alocacao') return 'alocacao';
    return 'revisao';
  };

  const currentContent = getContentStep(step);

  // Temp passenger form
  const [tempPassenger, setTempPassenger] = useState<PassengerFormData>({
    name: '', birthdate: '', nationality: '', document_type: undefined, document_number: '', gender: undefined, is_lead: false,
  });

  // Temp service item form
  const [tempItem, setTempItem] = useState<ServiceItemFormData & { assigned_vehicle_id?: string }>({
    date: '', time: '', service_type: 'tour', description: '', flight_number: '', flight_time: '',
    airline_locator: '', pick_up: '', drop_off: '', assigned_vehicle_id: '', notes: '',
  });

  // Manifesto: direct vehicle selection (no itinerary items)
  const [manifestoVehicleId, setManifestoVehicleId] = useState('');

  // Last passenger nationality/doc cloning
  const [lastNationality, setLastNationality] = useState('');
  const [lastDocType, setLastDocType] = useState<'passport' | 'rg' | 'dni' | 'other' | undefined>(undefined);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      os_number: initialData?.os_number || '',
      agency_name: initialData?.agency_name || '',
      reference_code: initialData?.reference_code || '',
      date_in: initialData?.date_in || '',
      date_out: initialData?.date_out || '',
      hotel_name: initialData?.hotel_name || '',
      pax_count: initialData?.pax_count || 1,
      children_count: initialData?.children_count || 0,
      lead_passenger_name: initialData?.lead_passenger_name || '',
      assigned_guide_id: initialData?.assigned_guide_id || '',
      notes: initialData?.notes || '',
    },
  });

  useEffect(() => {
    const load = async () => {
      const [{ data: v }, { data: g }, { data: links }] = await Promise.all([
        supabase.from('vehicles').select('*').eq('status', 'active').order('model'),
        supabase.from('drivers_guides').select('*').eq('status', 'active').order('name'),
        supabase.from('vehicle_driver_links').select('vehicle_id, driver_id'),
      ]);
      if (v) setVehicles(v);
      if (g) setGuides(g);
      if (links) setVehicleDriverLinks(links);
    };
    load();
  }, [supabase]);

  // ── Passenger helpers ──
  const addPassenger = () => {
    if (!tempPassenger.name.trim()) return;
    setPassengers(prev => [...prev, { ...tempPassenger }]);
    setLastNationality(tempPassenger.nationality || '');
    setLastDocType(tempPassenger.document_type);
    setTempPassenger({
      name: '', birthdate: '', nationality: '', document_type: undefined, document_number: '', gender: undefined, is_lead: false,
    });
  };

  const cloneLastPassengerData = () => {
    setTempPassenger(prev => ({
      ...prev,
      nationality: lastNationality,
      document_type: lastDocType,
    }));
  };

  const removePassenger = (index: number) => {
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  // ── Item helpers ──
  const addItem = () => {
    if (!tempItem.description.trim() || !tempItem.date) return;
    setItems(prev => [...prev, { ...tempItem }]);
    setTempItem({
      date: tempItem.date, time: '', service_type: 'tour', description: '', flight_number: '', flight_time: '',
      airline_locator: '', pick_up: '', drop_off: '', assigned_vehicle_id: '', notes: '',
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const isTransfer = (type: string) => type === 'transfer_in' || type === 'transfer_out';

  // Veículos ordenados: os vinculados ao guia selecionado vêm primeiro
  const getSortedVehicles = () => {
    const guideId = watchedData?.assigned_guide_id || getValues('assigned_guide_id');
    if (!guideId) return vehicles;
    const guideVehicleIds = vehicleDriverLinks
      .filter(l => l.driver_id === guideId)
      .map(l => l.vehicle_id);
    const linked = vehicles.filter(v => guideVehicleIds.includes(v.id));
    const others = vehicles.filter(v => !guideVehicleIds.includes(v.id));
    return [...linked, ...others];
  };

  const isGuideVehicle = (vehicleId: string) => {
    const guideId = watchedData?.assigned_guide_id || getValues('assigned_guide_id');
    if (!guideId) return false;
    return vehicleDriverLinks.some(l => l.driver_id === guideId && l.vehicle_id === vehicleId);
  };

  // ── Step navigation ──
  const getDadosFields = (): (keyof ServiceOrderFormData)[] => {
    if (docType === 'manifesto') return ['os_number', 'date_in'];
    return ['os_number', 'date_in', 'date_out', 'pax_count', 'lead_passenger_name'];
  };

  const CONTENT_FIELDS: Record<string, (keyof ServiceOrderFormData)[]> = {
    dados: getDadosFields(),
    pax: [],
    itinerario: [],
    alocacao: [],
    revisao: [],
  };

  const advanceStep = async () => {
    const fields = CONTENT_FIELDS[currentContent] || [];
    if (fields.length > 0) {
      const valid = await trigger(fields as any);
      if (!valid) return;
    }
    setStep(s => Math.min(TOTAL_STEPS, s + 1));
  };

  // ── Submit ──
  const onSubmit = async (data: ServiceOrderFormData) => {
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        os_number: data.os_number,
        doc_type: docType,
        agency_name: data.agency_name || null,
        reference_code: data.reference_code || null,
        lead_passenger_name: docType === 'manifesto' ? (passengers[0]?.name || '') : data.lead_passenger_name,
        pax_count: docType === 'manifesto' ? passengers.length : data.pax_count,
        children_count: data.children_count || 0,
        date_in: data.date_in,
        date_out: data.date_out || data.date_in,
        hotel_name: data.hotel_name || null,
        assigned_guide_id: data.assigned_guide_id || null,
        notes: data.notes || null,
        status: 'confirmed' as const,
        updated_at: new Date().toISOString(),
      };

      let osId = savedOsId;

      if (mode === 'create' || !osId) {
        const { data: newOS, error } = await supabase.from('service_orders').insert([payload]).select().single();
        if (error) throw error;
        osId = newOS.id;
        setSavedOsId(osId);
      } else {
        const { error } = await supabase.from('service_orders').update(payload).eq('id', osId);
        if (error) throw error;

        // Clear existing items and passengers for re-insertion
        await supabase.from('service_order_items').delete().eq('service_order_id', osId);
        await supabase.from('passengers').delete().eq('service_order_id', osId);
      }

      // Insert passengers
      if (passengers.length > 0) {
        const passengerPayload = passengers.map((p, i) => ({
          service_order_id: osId,
          name: p.name,
          birthdate: p.birthdate || null,
          nationality: p.nationality || null,
          document_type: p.document_type || null,
          document_number: p.document_number || null,
          gender: p.gender || null,
          is_lead: i === 0,
          sort_order: i,
        }));
        const { error } = await supabase.from('passengers').insert(passengerPayload);
        if (error) throw error;
      }

      // Insert items
      if (items.length > 0) {
        const itemPayload = items.map((it, i) => ({
          service_order_id: osId,
          date: it.date,
          time: it.time || null,
          service_type: it.service_type,
          description: it.description,
          flight_number: it.flight_number || null,
          flight_time: it.flight_time || null,
          airline_locator: it.airline_locator || null,
          pick_up: it.pick_up || null,
          drop_off: it.drop_off || null,
          assigned_vehicle_id: it.assigned_vehicle_id || null,
          sort_order: i,
          notes: it.notes || null,
        }));
        const { error } = await supabase.from('service_order_items').insert(itemPayload);
        if (error) throw error;
      }

      alert('Ordem de Serviço salva com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF Generation ──
  const generatePDF = async (type: 'os' | 'welcome' | 'manifest' | 'agenda', langOverride?: 'pt' | 'en' | 'es') => {
    setLoading(true);
    try {
      const data = getValues();
      const guide = guides.find(g => g.id === data.assigned_guide_id);
      
      const itemsWithVehicle = items.map(it => {
        const v = vehicles.find(v => v.id === it.assigned_vehicle_id);
        return {
          ...it,
          vehiclePlate: v?.plate || '',
          vehicleModel: v?.model || '',
        };
      });

      const lang = langOverride || emailLang;

      if (type === 'os') {
        const pdfData = {
          osNumber: data.os_number,
          agencyName: data.agency_name,
          referenceCode: data.reference_code,
          leadPassengerName: data.lead_passenger_name,
          paxCount: data.pax_count,
          childrenCount: data.children_count,
          dateIn: data.date_in,
          dateOut: data.date_out,
          hotelName: data.hotel_name,
          guideName: guide?.name,
          guidePhone: guide?.phone,
          status: 'Confirmada',
          passengers: passengers.map(p => ({
            name: p.name,
            birthdate: p.birthdate,
            nationality: p.nationality,
            documentType: p.document_type ? DOC_TYPE_LABELS[p.document_type] : undefined,
            documentNumber: p.document_number,
            gender: p.gender,
          })),
          items: itemsWithVehicle.map(it => ({
            date: it.date,
            time: it.time,
            serviceType: SERVICE_TYPE_LABELS[it.service_type] || it.service_type,
            description: it.description,
            flightNumber: it.flight_number,
            flightTime: it.flight_time,
            airlineLocator: it.airline_locator,
            pickUp: it.pick_up,
            dropOff: it.drop_off,
            vehiclePlate: it.vehiclePlate,
            vehicleModel: it.vehicleModel,
          })),
          notes: data.notes,
          driverName: guide?.name,
          vehiclePlate: itemsWithVehicle[0]?.vehiclePlate,
          vehicleModel: itemsWithVehicle[0]?.vehicleModel,
        };
        const blob = await pdf(<ServiceOrderTemplate data={pdfData} lang={lang} />).toBlob();
        downloadPdf(blob, `OS-${data.os_number}.pdf`);
      } else if (type === 'agenda') {
        const pdfData = {
          leadPassengerName: data.lead_passenger_name,
          paxCount: data.pax_count,
          childrenCount: data.children_count,
          hotelName: data.hotel_name,
          agencyName: data.agency_name,
          referenceCode: data.reference_code,
          dateIn: data.date_in,
          dateOut: data.date_out,
          osNumber: data.os_number,
          guideName: guide?.name,
          guidePhone: guide?.phone,
          observations: data.notes,
          items: itemsWithVehicle.map(it => ({
            description: it.description,
            serviceType: SERVICE_TYPE_LABELS[it.service_type] || it.service_type,
            date: it.date,
            time: it.time,
            flightNumber: it.flight_number,
            flightTime: it.flight_time,
            notes: it.notes,
          })),
        };
        const blob = await pdf(<PassengerAgendaTemplate data={pdfData} lang={lang} />).toBlob();
        downloadPdf(blob, `Agenda-${data.lead_passenger_name.replace(/\s/g, '_')}.pdf`);
      } else if (type === 'welcome') {
        const pdfData = {
          leadPassengerName: data.lead_passenger_name,
          paxCount: data.pax_count,
          dateIn: data.date_in,
          dateOut: data.date_out,
          hotelName: data.hotel_name,
          guideName: guide?.name,
          guidePhone: guide?.phone,
          items: itemsWithVehicle.map(it => ({
            date: it.date,
            time: it.time,
            serviceType: SERVICE_TYPE_LABELS[it.service_type] || it.service_type,
            description: it.description,
            flightNumber: it.flight_number,
            flightTime: it.flight_time,
            pickUp: it.pick_up,
            dropOff: it.drop_off,
          })),
        };
        const blob = await pdf(<WelcomeDocTemplate data={pdfData} lang={lang} />).toBlob();
        downloadPdf(blob, `Welcome-${data.lead_passenger_name.replace(/\s/g, '_')}.pdf`);
      } else if (type === 'manifest') {

        // Use manifesto direct vehicle or first item's vehicle
        const mVehicle = manifestoVehicleId
          ? vehicles.find(v => v.id === manifestoVehicleId)
          : items[0]?.assigned_vehicle_id
            ? vehicles.find(v => v.id === items[0].assigned_vehicle_id)
            : null;

        const pdfData = {
          companyName: 'Pratik Turismo / Maia Tours',
          vehiclePlate: mVehicle?.plate || '___________',
          driverName: guide?.name || '___________',
          driverDocument: guide?.document_number || '___________',
          date: data.date_in || '',
          departureCountry: data.departure_country || 'BRASIL',
          entryCountry: data.entry_country || 'ARGENTINA',
          borderPoint: data.border_point || 'Ponte Tancredo Neves',
          registrationCountry: data.departure_country || 'BRASIL',
          passengers: passengers.map(p => ({
            name: p.name || '',
            nationality: p.nationality || '',
            documentType: p.document_type ? (DOC_TYPE_LABELS[p.document_type] || '') : '',
            documentNumber: p.document_number || '',
            birthdate: p.birthdate || '',
            gender: p.gender || '',
          })),
        };
        const blob = await pdf(<BorderManifestTemplate data={pdfData} lang={lang} />).toBlob();
        downloadPdf(blob, `Manifesto-${data.os_number}.pdf`);
      }
    } catch (err: any) {
      alert('Erro ao gerar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Email send ──
  const sendEmail = async () => {
    if (!emailTo || !emailTo.includes('@')) {
      alert('Informe um e-mail válido.');
      return;
    }
    setEmailSending(true);
    try {
      const data = getValues();
      const guide = guides.find(g => g.id === data.assigned_guide_id);

      const itemsWithVehicle = items.map(it => {
        const v = vehicles.find(v => v.id === it.assigned_vehicle_id);
        return { ...it, vehiclePlate: v?.plate || '', vehicleModel: v?.model || '' };
      });

      const res = await fetch('/api/send-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTo,
          templateType: emailType,
          language: emailLang,
          osData: {
            osNumber: data.os_number,
            agencyName: data.agency_name,
            referenceCode: data.reference_code,
            leadPassengerName: data.lead_passenger_name,
            paxCount: data.pax_count,
            childrenCount: data.children_count,
            dateIn: data.date_in,
            dateOut: data.date_out,
            hotelName: data.hotel_name,
            guideName: guide?.name,
            guidePhone: guide?.phone,
            status: 'Confirmada',
            passengers: passengers.map(p => ({
              name: p.name,
              birthdate: p.birthdate,
              nationality: p.nationality,
              documentType: p.document_type ? DOC_TYPE_LABELS[p.document_type] : undefined,
              documentNumber: p.document_number,
              gender: p.gender,
            })),
            items: itemsWithVehicle.map(it => ({
              date: it.date,
              time: it.time,
              serviceType: SERVICE_TYPE_LABELS[it.service_type] || it.service_type,
              description: it.description,
              flightNumber: it.flight_number,
              flightTime: it.flight_time,
              airlineLocator: it.airline_locator,
              pickUp: it.pick_up,
              dropOff: it.drop_off,
              vehiclePlate: it.vehiclePlate,
              vehicleModel: it.vehicleModel,
            })),
            notes: data.notes,
            companyName: 'Pratik Turismo / Maia Tours',
            vehiclePlate: manifestoVehicleId
              ? vehicles.find(v => v.id === manifestoVehicleId)?.plate || ''
              : items[0]?.assigned_vehicle_id ? vehicles.find(v => v.id === items[0].assigned_vehicle_id)?.plate || '' : '',
            driverName: guide?.name || '',
            driverDocument: guide?.document_number || '',
            departureCountry: data.departure_country || 'BRASIL',
            entryCountry: data.entry_country || 'ARGENTINA',
            borderPoint: data.border_point || 'Ponte Tancredo Neves',
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro no envio');
      alert('E-mail enviado com sucesso!');
      setShowEmailModal(false);
      setEmailTo('');
    } catch (err: any) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  // ── Helpers ──
  const formatDate = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch { return d; }
  };

  const watchedData = watch();

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? `Nova ${docConfig.title}` : `Editar: ${initialData?.os_number}`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Passo {step} de {TOTAL_STEPS}</p>
        </div>
        <button onClick={() => router.push('/admin/operations')} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Step Labels */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {STEP_LABELS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { if (i + 1 < step) setStep(i + 1); }}
            className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold uppercase tracking-wide transition-colors ${
              step === i + 1 ? 'text-primary-600 border-b-2 border-primary-500' : step > i + 1 ? 'text-gray-400 cursor-pointer hover:text-primary-400' : 'text-gray-300'
            }`}
          >
            {step > i + 1 ? <Check size={14} className="inline mr-1" /> : null}{label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 md:p-8 min-h-[480px]">

          {/* ═══ STEP: Dados Gerais ═══ */}
          {currentContent === 'dados' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList size={20} />
                {docType === 'os' && 'Dados Gerais — Ordem de Servico'}
                {docType === 'agenda' && 'Dados Gerais — Agenda do Passageiro'}
                {docType === 'manifesto' && 'Dados Gerais — Manifesto de Fronteira'}
              </h2>

              {/* ── MANIFESTO: campos de fronteira ── */}
              {docType === 'manifesto' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nº OS / Ref *</label>
                      <input {...register('os_number')} className="w-full border p-3 rounded-lg" placeholder="Ex: 7998" />
                      {errors.os_number && <p className="text-red-500 text-xs mt-1">{errors.os_number.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Data da Travessia *</label>
                      <input type="date" {...register('date_in')} className="w-full border p-3 rounded-lg" />
                      {errors.date_in && <p className="text-red-500 text-xs mt-1">{errors.date_in.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Agencia</label>
                      <input {...register('agency_name')} className="w-full border p-3 rounded-lg" placeholder="Ex: ATP Turismo" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pais de Saida</label>
                      <input {...register('departure_country')} className="w-full border p-3 rounded-lg" placeholder="BRASIL" defaultValue="BRASIL" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pais de Entrada</label>
                      <input {...register('entry_country')} className="w-full border p-3 rounded-lg" placeholder="ARGENTINA" defaultValue="ARGENTINA" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Ponto de Fronteira</label>
                      <input {...register('border_point')} className="w-full border p-3 rounded-lg" placeholder="Ponte Tancredo Neves" defaultValue="Ponte Tancredo Neves" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observacoes internas</label>
                    <textarea {...register('notes')} className="w-full border p-3 rounded-lg h-16" placeholder="Notas internas (nao aparece no manifesto)..." />
                  </div>
                </>
              )}

              {/* ── OS / AGENDA: campos padrao ── */}
              {docType !== 'manifesto' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nº da OS *</label>
                      <input {...register('os_number')} className="w-full border p-3 rounded-lg" placeholder="Ex: 7998" />
                      {errors.os_number && <p className="text-red-500 text-xs mt-1">{errors.os_number.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Agencia</label>
                      <input {...register('agency_name')} className="w-full border p-3 rounded-lg" placeholder="Ex: ATP" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Ref / Localizador</label>
                      <input {...register('reference_code')} className="w-full border p-3 rounded-lg" placeholder="Ex: REBF / 146457" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hotel</label>
                      <input {...register('hotel_name')} className="w-full border p-3 rounded-lg" placeholder="Ex: LOI SUITES" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Passageiro Titular *</label>
                      <input {...register('lead_passenger_name')} className="w-full border p-3 rounded-lg" placeholder="Nome completo" />
                      {errors.lead_passenger_name && <p className="text-red-500 text-xs mt-1">{errors.lead_passenger_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Adultos *</label>
                      <input type="number" min={1} {...register('pax_count', { valueAsNumber: true })} className="w-full border p-3 rounded-lg" />
                      {errors.pax_count && <p className="text-red-500 text-xs mt-1">{errors.pax_count.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Criancas</label>
                      <input type="number" min={0} {...register('children_count', { valueAsNumber: true })} className="w-full border p-3 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observacoes</label>
                    <textarea {...register('notes')} className="w-full border p-3 rounded-lg h-20" placeholder={
                      docType === 'agenda' ? 'Observacoes para o passageiro...' : 'Notas internas para o guia...'
                    } />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ STEP: Passageiros ═══ */}
          {currentContent === 'pax' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users size={20} /> Passageiros</h2>
                {lastNationality && (
                  <button
                    type="button"
                    onClick={cloneLastPassengerData}
                    className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <Copy size={14} /> Clonar Nacionalidade/Doc
                  </button>
                )}
              </div>

              {/* Add Passenger Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nome Completo *</label>
                    <input
                      value={tempPassenger.name}
                      onChange={e => setTempPassenger({ ...tempPassenger, name: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      placeholder="Ex: David Bell"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={tempPassenger.birthdate || ''}
                      onChange={e => setTempPassenger({ ...tempPassenger, birthdate: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Sexo</label>
                    <select
                      value={tempPassenger.gender || ''}
                      onChange={e => setTempPassenger({ ...tempPassenger, gender: (e.target.value as 'M' | 'F') || undefined })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      <option value="">-</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nacionalidade</label>
                    <input
                      value={tempPassenger.nationality || ''}
                      onChange={e => setTempPassenger({ ...tempPassenger, nationality: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      placeholder="Ex: British, Argentine"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Doc.</label>
                    <select
                      value={tempPassenger.document_type || ''}
                      onChange={e => setTempPassenger({ ...tempPassenger, document_type: (e.target.value as any) || undefined })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="passport">Passaporte</option>
                      <option value="rg">RG</option>
                      <option value="dni">DNI</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nº Documento</label>
                    <input
                      value={tempPassenger.document_number || ''}
                      onChange={e => setTempPassenger({ ...tempPassenger, document_number: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      placeholder="Nº do documento"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addPassenger}
                  className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-primary-700"
                >
                  <Plus size={14} /> Adicionar Passageiro
                </button>
              </div>

              {/* Passengers List */}
              {passengers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Nascimento</th>
                        <th className="px-3 py-2">Sexo</th>
                        <th className="px-3 py-2">Nacionalidade</th>
                        <th className="px-3 py-2">Doc.</th>
                        <th className="px-3 py-2">Nº Doc.</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2">{formatDate(p.birthdate || '')}</td>
                          <td className="px-3 py-2">{p.gender || '-'}</td>
                          <td className="px-3 py-2">{p.nationality || '-'}</td>
                          <td className="px-3 py-2">{p.document_type ? DOC_TYPE_LABELS[p.document_type] : '-'}</td>
                          <td className="px-3 py-2">{p.document_number || '-'}</td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => removePassenger(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm italic">Nenhum passageiro adicionado ainda.</p>
              )}
            </div>
          )}

          {/* ═══ STEP: Itinerário ═══ */}
          {currentContent === 'itinerario' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><MapPin size={20} /> Montagem do Itinerário</h2>

              {/* Add Service Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Data *</label>
                    <input
                      type="date"
                      value={tempItem.date}
                      onChange={e => setTempItem({ ...tempItem, date: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Horário</label>
                    <input
                      type="time"
                      value={tempItem.time || ''}
                      onChange={e => setTempItem({ ...tempItem, time: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tipo *</label>
                    <select
                      value={tempItem.service_type}
                      onChange={e => setTempItem({ ...tempItem, service_type: e.target.value as any })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Veículo</label>
                    <select
                      value={tempItem.assigned_vehicle_id || ''}
                      onChange={e => setTempItem({ ...tempItem, assigned_vehicle_id: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                    >
                      <option value="">Sem veículo</option>
                      {getSortedVehicles().map(v => (
                        <option key={v.id} value={v.id}>
                          {isGuideVehicle(v.id) ? '★ ' : ''}{v.model} ({v.plate}) — {v.capacity} pax
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Descrição do Serviço *</label>
                  <input
                    value={tempItem.description}
                    onChange={e => setTempItem({ ...tempItem, description: e.target.value })}
                    className="w-full border p-2.5 rounded-lg text-sm"
                    placeholder="Ex: Private Half Day Brazilian Falls"
                  />
                </div>

                {/* Transfer-specific fields */}
                {isTransfer(tempItem.service_type) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-primary-50/50 p-3 rounded-lg border border-primary-100">
                    <div>
                      <label className="block text-xs font-bold text-primary-700 mb-1 flex items-center gap-1"><Plane size={12} /> Nº Voo</label>
                      <input
                        value={tempItem.flight_number || ''}
                        onChange={e => setTempItem({ ...tempItem, flight_number: e.target.value })}
                        className="w-full border p-2 rounded-lg text-sm"
                        placeholder="Ex: AR1780"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary-700 mb-1">Horário do Voo</label>
                      <input
                        type="time"
                        value={tempItem.flight_time || ''}
                        onChange={e => setTempItem({ ...tempItem, flight_time: e.target.value })}
                        className="w-full border p-2 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary-700 mb-1">Localizador Aéreo</label>
                      <input
                        value={tempItem.airline_locator || ''}
                        onChange={e => setTempItem({ ...tempItem, airline_locator: e.target.value })}
                        className="w-full border p-2 rounded-lg text-sm"
                        placeholder="Localizador"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pick-up</label>
                    <input
                      value={tempItem.pick_up || ''}
                      onChange={e => setTempItem({ ...tempItem, pick_up: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      placeholder="Local de embarque"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Drop-off</label>
                    <input
                      value={tempItem.drop_off || ''}
                      onChange={e => setTempItem({ ...tempItem, drop_off: e.target.value })}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      placeholder="Local de desembarque"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-primary-700"
                >
                  <Plus size={14} /> Adicionar Serviço
                </button>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((it, i) => {
                    const vehicle = vehicles.find(v => v.id === it.assigned_vehicle_id);
                    return (
                      <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${SERVICE_TYPE_COLORS[it.service_type]}`}>
                              {SERVICE_TYPE_LABELS[it.service_type]}
                            </span>
                            <span className="text-sm font-bold text-gray-800">{it.description}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>{formatDate(it.date)}{it.time ? ` ${it.time}` : ''}</span>
                            {it.flight_number && <span className="flex items-center gap-1"><Plane size={11} /> {it.flight_number} {it.flight_time ? `(${it.flight_time})` : ''}</span>}
                            {it.pick_up && <span>Pick-up: {it.pick_up}</span>}
                            {it.drop_off && <span>Drop-off: {it.drop_off}</span>}
                            {vehicle && <span className="flex items-center gap-1"><Bus size={11} /> {vehicle.model} ({vehicle.plate})</span>}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 mt-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm italic">Nenhum serviço adicionado ao itinerário.</p>
              )}
            </div>
          )}

          {/* ═══ STEP: Alocação de Recursos ═══ */}
          {currentContent === 'alocacao' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><UserCheck size={20} /> Alocação de Recursos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guide Selection */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Guia / Motorista Responsável</label>
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
                    const g = guides.find(g => g.id === watchedData.assigned_guide_id);
                    if (!g) return null;
                    return (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-primary-200">
                        <p className="font-bold text-primary-700">{g.name}</p>
                        {g.phone && <p className="text-sm text-gray-600">WhatsApp: {g.phone}</p>}
                        {g.document_number && <p className="text-sm text-gray-600">Doc: {g.document_number}</p>}
                        {g.languages_spoken?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {g.languages_spoken.map((l, i) => (
                              <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{l}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Vehicle Assignment */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  {docType === 'manifesto' ? (
                    <>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Veiculo do Manifesto *</label>
                      <select
                        value={manifestoVehicleId}
                        onChange={e => setManifestoVehicleId(e.target.value)}
                        className="w-full border p-3 rounded-lg bg-white text-sm"
                      >
                        <option value="">Selecione o veiculo...</option>
                        {getSortedVehicles().map(v => (
                          <option key={v.id} value={v.id}>
                            {isGuideVehicle(v.id) ? '* ' : ''}{v.model} ({v.plate})
                          </option>
                        ))}
                      </select>
                      {manifestoVehicleId && (() => {
                        const v = vehicles.find(v => v.id === manifestoVehicleId);
                        if (!v) return null;
                        return (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                            <p className="font-bold text-amber-700">{v.model}</p>
                            <p className="text-sm text-gray-600">Placa: {v.plate}</p>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Veiculos por Servico</label>
                      {items.length > 0 ? (
                        <div className="space-y-3">
                          {items.map((it, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${SERVICE_TYPE_COLORS[it.service_type]}`}>
                                {SERVICE_TYPE_LABELS[it.service_type]}
                              </span>
                              <span className="text-xs text-gray-600 truncate flex-1" title={it.description}>{it.description}</span>
                              <select
                                value={it.assigned_vehicle_id || ''}
                                onChange={e => {
                                  const updated = [...items];
                                  updated[i] = { ...updated[i], assigned_vehicle_id: e.target.value };
                                  setItems(updated);
                                }}
                                className="border p-1.5 rounded text-xs bg-white min-w-[160px]"
                              >
                                <option value="">Sem veiculo</option>
                                {getSortedVehicles().map(v => (
                                  <option key={v.id} value={v.id}>
                                    {isGuideVehicle(v.id) ? '* ' : ''}{v.model} ({v.plate})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Adicione servicos no passo anterior para alocar veiculos.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP: Revisão ═══ */}
          {currentContent === 'revisao' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Eye size={20} /> Revisao — {docConfig.title}</h2>

              {/* ── Summary Cards: adapta por tipo ── */}

              {/* OS: OS + Periodo/Hotel + Pax titular */}
              {docType === 'os' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-primary-600 uppercase mb-1">OS</p>
                    <p className="text-xl font-black text-primary-800">{watchedData.os_number || '-'}</p>
                    <p className="text-sm text-gray-600 mt-1">{watchedData.agency_name || 'Sem agencia'}</p>
                    {watchedData.reference_code && <p className="text-xs text-gray-500">Ref: {watchedData.reference_code}</p>}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Periodo</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(watchedData.date_in)} — {formatDate(watchedData.date_out)}</p>
                    <p className="text-sm text-gray-600 mt-1">Hotel: {watchedData.hotel_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Passageiro Titular</p>
                    <p className="text-sm font-bold text-gray-800">{watchedData.lead_passenger_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{watchedData.pax_count} adultos, {watchedData.children_count} criancas</p>
                  </div>
                </div>
              )}

              {/* Agenda: Titular + Periodo/Hotel + Agencia */}
              {docType === 'agenda' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-teal-600 uppercase mb-1">Passageiro Titular</p>
                    <p className="text-lg font-black text-teal-800">{watchedData.lead_passenger_name || '-'}</p>
                    <p className="text-sm text-gray-600 mt-1">{watchedData.pax_count} adultos, {watchedData.children_count} criancas</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Periodo</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(watchedData.date_in)} — {formatDate(watchedData.date_out)}</p>
                    <p className="text-sm text-gray-600 mt-1">Hotel: {watchedData.hotel_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Agencia / OS</p>
                    <p className="text-sm font-bold text-gray-800">{watchedData.agency_name || '-'}</p>
                    <p className="text-sm text-gray-600 mt-1">OS: {watchedData.os_number}</p>
                  </div>
                </div>
              )}

              {/* Manifesto: Fronteira + Veiculo/Motorista + Total Pax */}
              {docType === 'manifesto' && (() => {
                const g = guides.find(g => g.id === watchedData.assigned_guide_id);
                const mVehicle = manifestoVehicleId
                  ? vehicles.find(v => v.id === manifestoVehicleId)
                  : null;
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-600 uppercase mb-1">Travessia</p>
                        <p className="text-lg font-black text-amber-800">{formatDate(watchedData.date_in)}</p>
                        <p className="text-sm text-gray-600 mt-1">OS: {watchedData.os_number}</p>
                        {watchedData.agency_name && <p className="text-xs text-gray-500">{watchedData.agency_name}</p>}
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Fronteira</p>
                        <p className="text-sm font-bold text-gray-800">{watchedData.departure_country || 'BRASIL'} → {watchedData.entry_country || 'ARGENTINA'}</p>
                        <p className="text-sm text-gray-600 mt-1">{watchedData.border_point || 'Ponte Tancredo Neves'}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Passageiros</p>
                        <p className="text-2xl font-black text-gray-800">{passengers.length}</p>
                        <p className="text-sm text-gray-600 mt-1">na lista</p>
                      </div>
                    </div>
                    {/* Motorista / Veiculo */}
                    {(g || mVehicle) && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                        <Bus size={20} className="text-emerald-600" />
                        <div>
                          <p className="font-bold text-emerald-800">{g?.name || 'Motorista nao alocado'}</p>
                          <p className="text-sm text-emerald-600">
                            {mVehicle ? `${mVehicle.model} (${mVehicle.plate})` : 'Sem veiculo'}
                            {g?.document_number ? ` | Doc: ${g.document_number}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Guide (OS e Agenda) */}
              {docType !== 'manifesto' && watchedData.assigned_guide_id && (() => {
                const g = guides.find(g => g.id === watchedData.assigned_guide_id);
                if (!g) return null;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <UserCheck size={20} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-800">{g.name}</p>
                      <p className="text-sm text-emerald-600">{g.phone || 'Sem telefone'} | Doc: {g.document_number || '-'}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Passengers table */}
              {passengers.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Passageiros ({passengers.length})</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-left font-bold text-gray-500 uppercase">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">Nasc.</th>
                          <th className="px-3 py-2">Sexo</th>
                          <th className="px-3 py-2">Nacion.</th>
                          <th className="px-3 py-2">Doc</th>
                          <th className="px-3 py-2">N</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengers.map((p, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-1.5">{i + 1}</td>
                            <td className="px-3 py-1.5 font-medium">{p.name}</td>
                            <td className="px-3 py-1.5">{formatDate(p.birthdate || '')}</td>
                            <td className="px-3 py-1.5">{p.gender || '-'}</td>
                            <td className="px-3 py-1.5">{p.nationality || '-'}</td>
                            <td className="px-3 py-1.5">{p.document_type ? DOC_TYPE_LABELS[p.document_type] : '-'}</td>
                            <td className="px-3 py-1.5">{p.document_number || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Itinerary (OS e Agenda apenas) */}
              {docType !== 'manifesto' && items.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Itinerario ({items.length} servicos)</h3>
                  <div className="space-y-2">
                    {items.map((it, i) => {
                      const vehicle = vehicles.find(v => v.id === it.assigned_vehicle_id);
                      return (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                          <div className="text-center shrink-0">
                            <p className="text-xs font-bold text-gray-400">{formatDate(it.date)}</p>
                            {it.time && <p className="text-lg font-black text-gray-700">{it.time}</p>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${SERVICE_TYPE_COLORS[it.service_type]}`}>
                                {SERVICE_TYPE_LABELS[it.service_type]}
                              </span>
                              <span className="text-sm font-bold text-gray-800">{it.description}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                              {it.flight_number && <span><Plane size={11} className="inline" /> {it.flight_number} {it.flight_time ? `(${it.flight_time})` : ''}</span>}
                              {it.pick_up && <span>Pick-up: {it.pick_up}</span>}
                              {it.drop_off && <span>Drop-off: {it.drop_off}</span>}
                              {vehicle && <span><Bus size={11} className="inline" /> {vehicle.model} ({vehicle.plate})</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes (OS e Agenda) */}
              {docType !== 'manifesto' && watchedData.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">Observacoes</p>
                  <p className="text-sm text-gray-700">{watchedData.notes}</p>
                </div>
              )}

              {/* ── Documento: gerar e enviar ── */}
              {savedOsId && (
                <div className="border-t border-gray-200 pt-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Gerar {docConfig.title}</h3>
                  <div className={`border-2 rounded-xl p-4 ${
                    docType === 'os' ? 'border-primary-200 bg-primary-50' :
                    docType === 'agenda' ? 'border-teal-200 bg-teal-50' :
                    'border-amber-200 bg-amber-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`text-white rounded-lg p-2 ${
                        docType === 'os' ? 'bg-primary-600' : docType === 'agenda' ? 'bg-teal-600' : 'bg-amber-600'
                      }`}>
                        {docType === 'os' ? <FileText size={18} /> : docType === 'agenda' ? <ClipboardList size={18} /> : <Users size={18} />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${
                          docType === 'os' ? 'text-primary-900' : docType === 'agenda' ? 'text-teal-900' : 'text-amber-900'
                        }`}>{docConfig.title}</h4>
                        <p className={`text-xs ${
                          docType === 'os' ? 'text-primary-700' : docType === 'agenda' ? 'text-teal-700' : 'text-amber-700'
                        }`}>
                          {docType === 'os' && 'Documento interno para guia/motorista'}
                          {docType === 'agenda' && 'Agenda de servicos para o passageiro / agencia'}
                          {docType === 'manifesto' && 'Lista de passageiros para controle de fronteira'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={pdfLang}
                        onChange={e => setPdfLang(e.target.value as any)}
                        className={`border rounded-lg px-3 py-2 text-sm bg-white ${
                          docType === 'os' ? 'border-primary-300' : docType === 'agenda' ? 'border-teal-300' : 'border-amber-300'
                        }`}
                      >
                        {docType === 'manifesto' ? (
                          <>
                            <option value="es">Espanol</option>
                            <option value="pt">Portugues</option>
                            <option value="en">English</option>
                          </>
                        ) : (
                          <>
                            <option value="pt">Portugues</option>
                            <option value="en">English</option>
                            <option value="es">Espanol</option>
                          </>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => generatePDF(
                          docType === 'os' ? 'os' : docType === 'agenda' ? 'agenda' : 'manifest',
                          pdfLang
                        )}
                        disabled={loading}
                        className={`text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 ${
                          docType === 'os' ? 'bg-primary-600 hover:bg-primary-700' :
                          docType === 'agenda' ? 'bg-teal-600 hover:bg-teal-700' :
                          'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        <Download size={14} /> Baixar PDF
                      </button>

                      {docType === 'agenda' && (
                        <button
                          type="button"
                          onClick={() => generatePDF('welcome', pdfLang)}
                          disabled={loading}
                          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-600 disabled:opacity-50"
                        >
                          <Download size={14} /> Doc. Chegada
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEmailType(docType === 'os' ? 'os' : docType === 'agenda' ? 'agenda' : 'manifest');
                          setEmailLang(pdfLang);
                          setShowEmailModal(true);
                        }}
                        className={`border px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
                          docType === 'os' ? 'bg-primary-100 text-primary-700 border-primary-300 hover:bg-primary-200' :
                          docType === 'agenda' ? 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200' :
                          'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        <Mail size={14} /> Enviar por E-mail
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <ArrowLeft size={16} className="inline mr-1" /> Anterior
          </button>

          {step < TOTAL_STEPS ? (
            <button type="button" onClick={advanceStep} className="bg-primary-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700">
              Próximo <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:opacity-60">
              {loading ? 'Salvando...' : <><Save size={18} /> Salvar OS</>}
            </button>
          )}
        </div>
      </form>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800">
              Enviar por E-mail — {emailType === 'os' ? 'Ordem de Servico' : emailType === 'agenda' ? 'Agenda do Passageiro' : emailType === 'manifest' ? 'Manifesto de Fronteira' : 'Documento de Chegada'}
            </h3>
            <p className="text-xs text-gray-500">
              Idioma: {emailLang === 'pt' ? 'Portugues' : emailLang === 'en' ? 'English' : 'Espanol'}
            </p>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail do destinatario *</label>
              <input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de documento</label>
              <select
                value={emailType}
                onChange={e => setEmailType(e.target.value as any)}
                className="w-full border p-3 rounded-lg bg-white"
              >
                <option value="os">OS Interna (Guia)</option>
                <option value="agenda">Agenda do Passageiro</option>
                <option value="welcome">Documento de Chegada (Cliente)</option>
                <option value="manifest">Manifesto de Fronteira</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Idioma do documento</label>
              <select
                value={emailLang}
                onChange={e => setEmailLang(e.target.value as any)}
                className="w-full border p-3 rounded-lg bg-white"
              >
                <option value="pt">Portugues</option>
                <option value="en">English</option>
                <option value="es">Espanol</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendEmail}
                disabled={emailSending}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
              >
                {emailSending ? 'Enviando...' : <><Mail size={16} /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
