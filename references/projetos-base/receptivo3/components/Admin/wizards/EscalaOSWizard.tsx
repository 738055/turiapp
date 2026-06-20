'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompanyInfo } from './useCompanyInfo';
import {
  Plus, Trash2, FileText, Download, Save, ArrowLeft, Users, Calendar, Mail, X,
} from 'lucide-react';

interface ServiceItem {
  time: string;
  hotel: string;
  pax_name: string;
  qty: number;
  idioma: string;
  tipo: string;
  agencia: string;
}

interface PaxItem {
  name: string;
  dob: string;
  nationality: string;
  document: string;
}

interface EscalaOSWizardProps {
  initialData?: any;
  mode: 'create' | 'edit';
}

const IDIOMAS = ['PORTUGUES', 'ESPANHOL', 'INGLES', 'FRANCES', 'ALEMAO', 'ITALIANO'];
const EMPTY_SERVICE: ServiceItem = { time: '', hotel: '', pax_name: '', qty: 1, idioma: 'PORTUGUES', tipo: 'REGULAR', agencia: '' };
const EMPTY_PAX: PaxItem = { name: '', dob: '', nationality: '', document: '' };

export default function EscalaOSWizard({ initialData, mode }: EscalaOSWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const company = useCompanyInfo();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialData?.id || null);
  const [osNumber, setOsNumber] = useState(initialData?.os_number || '');

  const [guides, setGuides] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [selectedGuide, setSelectedGuide] = useState(initialData?.assigned_guide_id || '');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceDate, setServiceDate] = useState(initialData?.date_in || '');
  const [servicoGeral, setServicoGeral] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([{ ...EMPTY_SERVICE }]);
  const [paxList, setPaxList] = useState<PaxItem[]>([{ ...EMPTY_PAX }]);

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [pdfLang, setPdfLang] = useState<'pt' | 'en' | 'es'>('pt');

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

    if (initialData) {
      try {
        const extra = JSON.parse(initialData.notes || '{}');
        if (extra.vehicle_id) setSelectedVehicle(extra.vehicle_id);
        if (extra.servico_geral) setServicoGeral(extra.servico_geral);
        if (extra.user_notes) setNotes(extra.user_notes);
      } catch {}

      if (initialData.items?.length) {
        setServices(initialData.items.map((it: any) => ({
          time: it.time || '',
          hotel: it.pick_up || '',
          pax_name: it.description || '',
          qty: 1,
          idioma: 'PORTUGUES',
          tipo: 'REGULAR',
          agencia: '',
        })));
      }

      if (initialData.passengers?.length) {
        setPaxList(initialData.passengers.map((p: any) => ({
          name: p.name || '',
          dob: p.birthdate || '',
          nationality: p.nationality || '',
          document: [p.document_type, p.document_number].filter(Boolean).join(' '),
        })));
      }
    }
  }, []);

  const handleSave = async () => {
    if (!selectedGuide || !selectedVehicle || !serviceDate) {
      alert('Selecione Motorista, Veículo e Data antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);

      let currentOsNumber = osNumber;
      if (!currentOsNumber) {
        const { count } = await supabase
          .from('service_orders')
          .select('id', { count: 'exact', head: true })
          .eq('doc_type', 'os');
        currentOsNumber = `OS-${((count || 0) + 1).toString().padStart(6, '0')}`;
        setOsNumber(currentOsNumber);
      }

      const extra = JSON.stringify({
        vehicle_id: selectedVehicle,
        servico_geral: servicoGeral,
        user_notes: notes,
        vehicle_plate: vehicle?.plate,
        vehicle_model: vehicle?.model,
      });

      const payload = {
        doc_type: 'os',
        os_number: currentOsNumber,
        lead_passenger_name: services.find(s => s.pax_name)?.pax_name || '-',
        pax_count: services.reduce((sum, s) => sum + s.qty, 0),
        children_count: 0,
        date_in: serviceDate,
        date_out: serviceDate,
        assigned_guide_id: selectedGuide || null,
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
        await supabase.from('passengers').delete().eq('service_order_id', osId);
      }

      const validServices = services.filter(s => s.hotel || s.pax_name);
      if (validServices.length > 0) {
        await supabase.from('service_order_items').insert(validServices.map((s, i) => ({
          service_order_id: osId,
          date: serviceDate,
          time: s.time,
          service_type: 'tour',
          description: s.pax_name || '',
          pick_up: s.hotel,
          assigned_vehicle_id: selectedVehicle || null,
          notes: [
            s.idioma && `Idioma: ${s.idioma}`,
            s.tipo && `Tipo: ${s.tipo}`,
            s.agencia && `Ag: ${s.agencia}`,
          ].filter(Boolean).join(' | '),
          sort_order: i,
        })));
      }

      const validPax = paxList.filter(p => p.name);
      if (validPax.length > 0) {
        await supabase.from('passengers').insert(validPax.map((p, i) => ({
          service_order_id: osId,
          name: p.name,
          birthdate: p.dob || null,
          nationality: p.nationality || null,
          document_number: p.document || null,
          is_lead: i === 0,
          sort_order: i,
        })));
      }

      alert(`OS ${currentOsNumber} salva com sucesso!`);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addService = () => setServices([...services, { ...EMPTY_SERVICE }]);
  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));
  const updateService = (idx: number, field: keyof ServiceItem, value: string | number) => {
    const next = [...services];
    (next[idx] as any)[field] = value;
    setServices(next);
  };

  const addPax = () => setPaxList([...paxList, { ...EMPTY_PAX }]);
  const removePax = (idx: number) => setPaxList(paxList.filter((_, i) => i !== idx));
  const updatePax = (idx: number, field: keyof PaxItem, value: string) => {
    const next = [...paxList];
    next[idx][field] = value;
    setPaxList(next);
  };

  const buildDoc = (): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const guide = guides.find(g => g.id === selectedGuide);
    const vehicle = vehicles.find(v => v.id === selectedVehicle);

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company_name.toUpperCase(), 200, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`CNPJ: ${company.cnpj_formatted}`, 200, 21, { align: 'right' });
    doc.text(company.address, 200, 27, { align: 'right' });
    doc.line(10, 33, 200, 33);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEM DE SERVIÇO / ESCALA', 105, 43, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(200, 0, 0);
    doc.text(`Nº OS: ${osNumber}`, 105, 51, { align: 'center' });
    doc.setTextColor(0);

    // Info box
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 58, 182, 25, 'F');
    doc.setDrawColor(200);
    doc.rect(14, 58, 182, 25, 'S');
    doc.text(`Motorista/Guia: ${guide?.name || '-'}`, 20, 68);
    doc.text(`Telefone: ${guide?.phone || '-'}`, 120, 68);
    doc.text(`Veículo: ${vehicle?.model || '-'}`, 20, 77);
    doc.text(`Placa: ${vehicle?.plate || '-'}`, 120, 77);

    let finalY = 95;
    if (servicoGeral) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Serviço: ${servicoGeral}`, 14, finalY);
      finalY += 8;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Lista de Pick-ups — ${serviceDate ? new Date(serviceDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, 14, finalY);

    const serviceRows = services.filter(s => s.hotel || s.pax_name).map(s => [
      s.time || '-', s.hotel || '', s.pax_name || '', s.qty.toString(), s.idioma || '', s.tipo || '', s.agencia || '',
    ]);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Horário', 'Hotel / Local', 'Nome PAX', 'Qtd', 'Idioma', 'Tipo', 'Agência']],
      body: serviceRows.length ? serviceRows : [['-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 18 }, 1: { cellWidth: 38 }, 2: { cellWidth: 45 },
        3: { cellWidth: 12, halign: 'center' as const }, 4: { cellWidth: 22 }, 5: { cellWidth: 22 }, 6: { cellWidth: 25 },
      },
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    const validPax = paxList.filter(p => p.name);
    if (validPax.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Lista de Passageiros (${validPax.length})`, 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Nome Completo', 'Data Nasc.', 'Nacionalidade', 'Documento']],
        body: validPax.map(p => [p.name, p.dob ? new Date(p.dob + 'T12:00:00').toLocaleDateString('pt-BR') : '', p.nationality || '', p.document || '']),
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 50], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (notes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text(`Obs: ${notes}`, 14, finalY);
      doc.setTextColor(0);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.line(20, pageHeight - 30, 80, pageHeight - 30);
    doc.text('Motorista / Guia', 50, pageHeight - 25, { align: 'center' });
    doc.line(120, pageHeight - 30, 185, pageHeight - 30);
    doc.text('Responsável Pratik Turismo', 152, pageHeight - 25, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 14, pageHeight - 10);

    return doc;
  };

  const generatePDF = () => {
    if (!osNumber) { alert('Salve a OS primeiro para gerar o número.'); return; }
    setLoading(true);
    try { buildDoc().save(`OS-${osNumber}.pdf`); }
    finally { setLoading(false); }
  };

  const sendEmail = async () => {
    if (!emailTo.includes('@')) { alert('Informe um e-mail válido.'); return; }
    setEmailSending(true);
    try {
      const arrayBuffer = buildDoc().output('arraybuffer');
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);

      const res = await fetch('/api/send-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTo,
          language: pdfLang,
          pdfBase64: btoa(binary),
          filename: `OS-${osNumber}.pdf`,
          subject: pdfLang === 'en'
            ? `Service Order ${osNumber} | Pratik Turismo`
            : pdfLang === 'es'
              ? `Orden de Servicio ${osNumber} | Pratik Turismo`
              : `Ordem de Serviço ${osNumber} | Pratik Turismo`,
          osNumber,
          leadPassengerName: services.find(s => s.pax_name)?.pax_name || '-',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro desconhecido');
      alert('E-mail enviado com sucesso!');
      setShowEmailModal(false);
      setEmailTo('');
    } catch (err: any) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-6 bg-white shadow-xl rounded-xl overflow-hidden">
      {/* HEADER */}
      <div className="bg-gray-800 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/operations')} className="p-2 hover:bg-gray-700 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">
            {savedId ? `Editando OS ${osNumber}` : 'Nova Ordem de Serviço / Escala'}
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={generatePDF}
            disabled={loading || !osNumber}
            className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 ${!osNumber ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            <Download size={18} /> {loading ? 'Gerando...' : 'Baixar PDF'}
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!osNumber}
            className="bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Mail size={18} /> E-mail
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* MOTORISTA + VEÍCULO */}
        <div className="grid md:grid-cols-2 gap-8 mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Motorista / Guia Responsável</label>
            <select
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-primary-500 outline-none"
              value={selectedGuide}
              onChange={e => setSelectedGuide(e.target.value)}
            >
              <option value="">Selecione...</option>
              {guides.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Veículo Utilizado</label>
            <select
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-primary-500 outline-none"
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
            >
              <option value="">Selecione...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>
        </div>

        {/* DADOS DO SERVIÇO */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <Calendar size={20} className="text-primary-600" /> Dados do Serviço
          </h3>
          <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Data do Serviço</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                value={serviceDate}
                onChange={e => setServiceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Serviço / Tour</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                placeholder="Ex: CATARATAS ARGENTINA, TRANSFER AEROPORTO"
                value={servicoGeral}
                onChange={e => setServicoGeral(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Observações</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 outline-none h-16"
                placeholder="Notas internas para o motorista/guia..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* LISTA DE PICK-UPS */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <FileText size={20} className="text-primary-600" /> Lista de Pick-ups / Serviços
            {(() => {
              const totalQty = services.reduce((s, r) => s + r.qty, 0);
              const maxPax = paxList.filter(p => p.name).length;
              const over = maxPax > 0 && totalQty > maxPax;
              return (
                <span className={`ml-auto text-sm font-semibold px-3 py-1 rounded-full ${over ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-700'}`}>
                  {totalQty} pax alocados{maxPax > 0 ? ` / ${maxPax} na lista` : ''}
                  {over && ' ⚠'}
                </span>
              );
            })()}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-2">Hora</div>
              <div className="col-span-2">Hotel / Local</div>
              <div className="col-span-2">Nome Titular</div>
              <div className="col-span-1">Qtd</div>
              <div className="col-span-2">Idioma</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-1 text-center">Ação</div>
            </div>

            {services.map((svc, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-center bg-white md:bg-transparent p-3 md:p-0 rounded shadow-sm md:shadow-none border md:border-none">
                <div className="md:col-span-2">
                  <input type="time" className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs" value={svc.time} onChange={e => updateService(idx, 'time', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input placeholder="Hotel/Local" className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs" value={svc.hotel} onChange={e => updateService(idx, 'hotel', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input placeholder="Nome Titular" className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs" value={svc.pax_name} onChange={e => updateService(idx, 'pax_name', e.target.value)} />
                </div>
                <div className="md:col-span-1">
                  <input type="number" min={1} className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs text-center" value={svc.qty} onChange={e => updateService(idx, 'qty', parseInt(e.target.value) || 1)} />
                </div>
                <div className="md:col-span-2">
                  <select className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs bg-white" value={svc.idioma} onChange={e => updateService(idx, 'idioma', e.target.value)}>
                    {IDIOMAS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select className="w-full p-2 border rounded focus:border-primary-500 outline-none text-xs bg-white" value={svc.tipo} onChange={e => updateService(idx, 'tipo', e.target.value)}>
                    <option value="REGULAR">Regular</option>
                    <option value="PRIVATIVO">Privativo</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  {services.length > 1 && (
                    <button onClick={() => removeService(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addService} className="mt-2 text-primary-600 font-bold flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm">
              <Plus size={18} /> Adicionar Pick-up
            </button>
          </div>
        </div>

        {/* PASSAGEIROS */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <Users size={20} className="text-primary-600" /> Lista de Passageiros ({paxList.filter(p => p.name).length})
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-4">Nome Completo</div>
              <div className="col-span-2">Data Nasc.</div>
              <div className="col-span-2">Nacionalidade</div>
              <div className="col-span-3">Documento</div>
              <div className="col-span-1 text-center">Ação</div>
            </div>

            {paxList.map((pax, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-center bg-white md:bg-transparent p-3 md:p-0 rounded shadow-sm md:shadow-none border md:border-none">
                <div className="md:col-span-4">
                  <input placeholder="Nome" className="w-full p-2.5 border rounded focus:border-primary-500 outline-none text-sm" value={pax.name} onChange={e => updatePax(idx, 'name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input type="date" className="w-full p-2.5 border rounded focus:border-primary-500 outline-none text-sm" value={pax.dob} onChange={e => updatePax(idx, 'dob', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input placeholder="Nacionalidade" className="w-full p-2.5 border rounded focus:border-primary-500 outline-none text-sm" value={pax.nationality} onChange={e => updatePax(idx, 'nationality', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <input placeholder="Tipo e Nº Doc." className="w-full p-2.5 border rounded focus:border-primary-500 outline-none text-sm" value={pax.document} onChange={e => updatePax(idx, 'document', e.target.value)} />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button onClick={() => removePax(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            <button onClick={addPax} className="mt-2 text-primary-600 font-bold flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-lg">
              <Plus size={18} /> Adicionar Passageiro
            </button>
          </div>
        </div>
      </div>

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Enviar OS por E-mail</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail do Destinatário</label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                  placeholder="guia@email.com"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Idioma do PDF</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white outline-none" value={pdfLang} onChange={e => setPdfLang(e.target.value as any)}>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEmailModal(false)} className="flex-1 p-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={sendEmail}
                disabled={emailSending}
                className="flex-1 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold disabled:opacity-50"
              >
                {emailSending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
