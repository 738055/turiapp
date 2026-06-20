'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompanyInfo } from './useCompanyInfo';
import {
  Plus, Trash2, FileText, Download, Save, ArrowLeft, Globe, Users, Mail, X,
} from 'lucide-react';

type Destination = 'ARGENTINA' | 'PARAGUAI';

interface CrewMember {
  name: string;
  dob: string;
  nationality: string;
  document: string;
}

interface ManifestPax {
  name: string;
  dob: string;
  nationality: string;
  document: string;
}

interface ManifestoWizardProps {
  initialData?: any;
  mode: 'create' | 'edit';
}

const DESTINATION_PRESETS: Record<Destination, { country_to: string; border_point: string }> = {
  ARGENTINA: { country_to: 'ARGENTINA', border_point: 'PONTE TANCREDO NEVES' },
  PARAGUAI: { country_to: 'PARAGUAI', border_point: 'PONTE DA AMIZADE' },
};

const EMPTY_CREW: CrewMember = { name: '', dob: '', nationality: '', document: '' };
const EMPTY_PAX: ManifestPax = { name: '', dob: '', nationality: '', document: '' };

export default function ManifestoWizard({ initialData, mode }: ManifestoWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const company = useCompanyInfo();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialData?.id || null);
  const [manifestNumber, setManifestNumber] = useState(initialData?.os_number || '');

  const [guides, setGuides] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [destination, setDestination] = useState<Destination>('ARGENTINA');
  const [selectedGuide, setSelectedGuide] = useState(initialData?.assigned_guide_id || '');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [travelDate, setTravelDate] = useState(initialData?.date_in || '');
  const [countryFrom, setCountryFrom] = useState('BRASIL');
  const [countryTo, setCountryTo] = useState('ARGENTINA');
  const [countryRegistration, setCountryRegistration] = useState('BRASIL');
  const [borderPoint, setBorderPoint] = useState('PONTE TANCREDO NEVES');
  const [crew, setCrew] = useState<CrewMember[]>([{ ...EMPTY_CREW }]);
  const [passengers, setPassengers] = useState<ManifestPax[]>([{ ...EMPTY_PAX }]);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);

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
        if (extra.destination) {
          setDestination(extra.destination as Destination);
        }
        if (extra.country_from) setCountryFrom(extra.country_from);
        if (extra.country_to) setCountryTo(extra.country_to);
        if (extra.country_registration) setCountryRegistration(extra.country_registration);
        if (extra.border_point) setBorderPoint(extra.border_point);
        if (extra.crew?.length) setCrew(extra.crew);
      } catch {}

      if (initialData.passengers?.length) {
        setPassengers(initialData.passengers.map((p: any) => ({
          name: p.name || '',
          dob: p.birthdate || '',
          nationality: p.nationality || '',
          document: [p.document_type, p.document_number].filter(Boolean).join(' '),
        })));
      }
    }
  }, []);

  const handleDestinationChange = (dest: Destination) => {
    const preset = DESTINATION_PRESETS[dest];
    setDestination(dest);
    setCountryTo(preset.country_to);
    setBorderPoint(preset.border_point);
  };

  const handleSave = async () => {
    if (!selectedGuide || !selectedVehicle) {
      alert('Selecione Motorista e Veículo antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);

      let currentNumber = manifestNumber;
      if (!currentNumber) {
        const { count } = await supabase
          .from('service_orders')
          .select('id', { count: 'exact', head: true })
          .eq('doc_type', 'manifesto');
        currentNumber = `MAN-${((count || 0) + 1).toString().padStart(6, '0')}`;
        setManifestNumber(currentNumber);
      }

      const extra = JSON.stringify({
        vehicle_id: selectedVehicle,
        destination,
        country_from: countryFrom,
        country_to: countryTo,
        country_registration: countryRegistration,
        border_point: borderPoint,
        vehicle_plate: vehicle?.plate,
        vehicle_model: vehicle?.model,
        crew,
      });

      const payload = {
        doc_type: 'manifesto',
        os_number: currentNumber,
        lead_passenger_name: passengers.find(p => p.name)?.name || '-',
        pax_count: passengers.filter(p => p.name).length,
        children_count: 0,
        date_in: travelDate || null,
        date_out: travelDate || null,
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
        await supabase.from('passengers').delete().eq('service_order_id', osId);
      }

      const validPax = passengers.filter(p => p.name);
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

      alert(`Manifesto ${currentNumber} salvo com sucesso!`);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCrew = () => setCrew([...crew, { ...EMPTY_CREW }]);
  const removeCrew = (idx: number) => setCrew(crew.filter((_, i) => i !== idx));
  const updateCrew = (idx: number, field: keyof CrewMember, value: string) => {
    const next = [...crew];
    next[idx][field] = value;
    setCrew(next);
  };

  const addPassenger = () => setPassengers([...passengers, { ...EMPTY_PAX }]);
  const removePassenger = (idx: number) => setPassengers(passengers.filter((_, i) => i !== idx));
  const updatePassenger = (idx: number, field: keyof ManifestPax, value: string) => {
    const next = [...passengers];
    next[idx][field] = value;
    setPassengers(next);
  };

  const buildDoc = (): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const isArgentina = destination === 'ARGENTINA';
    const guide = guides.find(g => g.id === selectedGuide);
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    const numDisplay = manifestNumber.replace('MAN-', '').replace('OS-', '');

    // Migration header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (isArgentina) {
      doc.text('MINISTERIO DEL INTERIOR - DIRECCIÓN NACIONAL DE MIGRACIONES', pageWidth / 2, 12, { align: 'center' });
    } else {
      doc.text('DIRECCIÓN GENERAL DE MIGRACIONES - REPÚBLICA DEL PARAGUAY', pageWidth / 2, 12, { align: 'center' });
    }
    doc.setDrawColor(0);
    doc.line(10, 15, pageWidth - 10, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('HOJA Nº: 1 / 1', 14, 20);
    if (isArgentina) {
      doc.text('ANEXO II Resolución 2.997/86', pageWidth - 14, 20, { align: 'right' });
    } else {
      doc.text('MANIFIESTO DE PASAJEROS', pageWidth - 14, 20, { align: 'right' });
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MANIFIESTO DE TRANSPORTE DE PASAJEROS - MINIBUSES', pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('EXCLUSIVO CORREDOR TURÍSTICO', pageWidth / 2, 33, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text(`Nº MANIFIESTO: ${numDisplay.padStart(6, '0')}`, pageWidth - 14, 40, { align: 'right' });
    doc.setTextColor(0);

    // Info table
    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7 },
      body: [
        [
          { content: `EMPRESA:\n${company.company_name.toUpperCase()}\nCNPJ: ${company.cnpj_formatted}`, styles: { fontStyle: 'bold' } },
          { content: `MATRÍCULA Nº:\n${vehicle?.plate || '-'}` },
          { content: `SALIÓ DE (PAÍS):\n${countryFrom}` },
          { content: `ENTRÓ POR (PAÍS):\n${countryTo}` },
        ],
        [
          { content: `FECHA:\n${travelDate ? new Date(travelDate + 'T12:00:00').toLocaleDateString('es-AR') : '-'}` },
          { content: `PAÍS REGISTRO:\n${countryRegistration}` },
          { content: `PUNTO DE FRONTERA:\n${borderPoint}`, colSpan: 2 },
        ],
      ],
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 40 },
        2: { cellWidth: 47 },
        3: { cellWidth: 40 },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 5;

    // Crew table
    const crewRows = crew.map((c, i) => [
      (i + 1).toString(),
      c.name || '',
      c.dob ? new Date(c.dob + 'T12:00:00').toLocaleDateString('es-AR') : '',
      c.nationality || '',
      c.document || '',
      '',
    ]);
    while (crewRows.length < 2) {
      crewRows.push([(crewRows.length + 1).toString(), '', '', '', '', '']);
    }

    autoTable(doc, {
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      head: [
        [{ content: 'TRIPULANTES', colSpan: 6, styles: { halign: 'center', fillColor: [180, 180, 180], textColor: 0, fontStyle: 'bold', fontSize: 9 } }],
        ['Nº', 'APELLIDOS Y NOMBRES', 'F. NAC.', 'NACIONALIDAD', 'TIPO Y Nº DE DOC.', 'CALIF. MIGRAT.'],
      ],
      body: crewRows,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 62 },
        2: { cellWidth: 25, halign: 'center' as const },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20, halign: 'center' as const },
      },
    });

    finalY = (doc as any).lastAutoTable.finalY + 5;

    // Passengers table
    const paxRows = passengers.map((p, i) => [
      (i + 1).toString(),
      p.name || '',
      p.dob ? new Date(p.dob + 'T12:00:00').toLocaleDateString('es-AR') : '',
      p.nationality || '',
      p.document || '',
      '',
    ]);
    while (paxRows.length < 20) {
      paxRows.push([(paxRows.length + 1).toString(), '', '', '', '', '']);
    }

    autoTable(doc, {
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      head: [
        [{ content: `PASAJEROS (${passengers.filter(p => p.name).length})`, colSpan: 6, styles: { halign: 'center', fillColor: [180, 180, 180], textColor: 0, fontStyle: 'bold', fontSize: 9 } }],
        ['Nº', 'APELLIDOS Y NOMBRES', 'F. NAC.', 'NACIONALIDAD', 'TIPO Y Nº DE DOC.', 'CALIF. MIGRAT.'],
      ],
      body: paxRows,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 62 },
        2: { cellWidth: 25, halign: 'center' as const },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20, halign: 'center' as const },
      },
    });

    finalY = (doc as any).lastAutoTable.finalY + 10;

    // Footer signatures
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 40) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(150);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(14, finalY, 60, 25);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(7);
    doc.text('FIRMA Y SELLO DE LA EMPRESA', 44, finalY + 30, { align: 'center' });

    doc.setDrawColor(150);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(80, finalY, 50, 25);
    doc.setLineDashPattern([], 0);
    doc.text(`CONDUCTOR: ${guide?.name || ''}`, 105, finalY + 30, { align: 'center' });

    doc.setFontSize(8);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, finalY + 10, { align: 'right' });
    doc.text('Página 1 de 1', pageWidth - 14, finalY + 16, { align: 'right' });

    return doc;
  };

  const generatePDF = () => {
    if (!manifestNumber) {
      alert('Salve o manifesto primeiro para gerar o número.');
      return;
    }
    setLoading(true);
    try {
      buildDoc().save(`Manifesto-${manifestNumber}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!emailTo.includes('@')) {
      alert('Informe um e-mail válido.');
      return;
    }
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
          language: 'es',
          pdfBase64: btoa(binary),
          filename: `Manifesto-${manifestNumber}.pdf`,
          subject: `Manifesto de Fronteira ${manifestNumber} | Pratik Turismo`,
          osNumber: manifestNumber,
          leadPassengerName: passengers.find(p => p.name)?.name || '-',
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
            {savedId ? `Editando Manifesto ${manifestNumber}` : 'Novo Manifesto de Fronteira'}
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
            disabled={loading || !manifestNumber}
            className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 ${!manifestNumber ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            <Download size={18} /> {loading ? 'Gerando...' : 'Baixar PDF'}
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!manifestNumber}
            className="bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Mail size={18} /> E-mail
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* DESTINO */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase">Destino da Travessia</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleDestinationChange('ARGENTINA')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${destination === 'ARGENTINA' ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇦🇷</span>
                <div>
                  <div className={`font-bold text-lg ${destination === 'ARGENTINA' ? 'text-primary-700' : 'text-gray-700'}`}>Argentina</div>
                  <div className="text-xs text-gray-500">Ponte Tancredo Neves</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleDestinationChange('PARAGUAI')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${destination === 'PARAGUAI' ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇵🇾</span>
                <div>
                  <div className={`font-bold text-lg ${destination === 'PARAGUAI' ? 'text-red-700' : 'text-gray-700'}`}>Paraguai</div>
                  <div className="text-xs text-gray-500">Ponte da Amizade</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* MOTORISTA + VEÍCULO */}
        <div className="grid md:grid-cols-2 gap-8 mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Motorista Responsável</label>
            <select
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-green-500 outline-none"
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
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-green-500 outline-none"
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
            >
              <option value="">Selecione...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>
        </div>

        {/* DADOS DA TRAVESSIA */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <Globe size={20} className="text-green-600" /> Dados da Travessia
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Data da Viagem</label>
              <input type="date" className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" value={travelDate} onChange={e => setTravelDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">País de Saída</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" value={countryFrom} onChange={e => setCountryFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">País de Entrada</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" value={countryTo} onChange={e => setCountryTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">País de Registro</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" value={countryRegistration} onChange={e => setCountryRegistration(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Ponto de Fronteira</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" value={borderPoint} onChange={e => setBorderPoint(e.target.value)} />
            </div>
          </div>
        </div>

        {/* TRIPULANTES */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <FileText size={20} className="text-green-600" /> Tripulantes
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-4">Nome Completo</div>
              <div className="col-span-2">Data Nasc.</div>
              <div className="col-span-2">Nacionalidade</div>
              <div className="col-span-3">Documento</div>
              <div className="col-span-1 text-center">Ação</div>
            </div>
            {crew.map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-center bg-white md:bg-transparent p-3 md:p-0 rounded shadow-sm md:shadow-none border md:border-none">
                <div className="md:col-span-4">
                  <input placeholder="Nome" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={c.name} onChange={e => updateCrew(idx, 'name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input type="date" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={c.dob} onChange={e => updateCrew(idx, 'dob', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input placeholder="Nacionalidade" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={c.nationality} onChange={e => updateCrew(idx, 'nationality', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <input placeholder="Tipo e Nº Doc." className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={c.document} onChange={e => updateCrew(idx, 'document', e.target.value)} />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  {crew.length > 1 && (
                    <button onClick={() => removeCrew(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addCrew} className="mt-2 text-green-600 font-bold flex items-center gap-2 hover:bg-green-50 px-4 py-2 rounded-lg">
              <Plus size={18} /> Adicionar Tripulante
            </button>
          </div>
        </div>

        {/* PASSAGEIROS */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-2">
            <Users size={20} className="text-green-600" /> Passageiros ({passengers.filter(p => p.name).length})
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-4">Nome Completo</div>
              <div className="col-span-2">Data Nasc.</div>
              <div className="col-span-2">Nacionalidade</div>
              <div className="col-span-3">Documento</div>
              <div className="col-span-1 text-center">Ação</div>
            </div>
            {passengers.map((pax, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-center bg-white md:bg-transparent p-3 md:p-0 rounded shadow-sm md:shadow-none border md:border-none">
                <div className="md:col-span-4">
                  <input placeholder="Nome" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={pax.name} onChange={e => updatePassenger(idx, 'name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input type="date" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={pax.dob} onChange={e => updatePassenger(idx, 'dob', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <input placeholder="Nacionalidade" className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={pax.nationality} onChange={e => updatePassenger(idx, 'nationality', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <input placeholder="Tipo e Nº Doc." className="w-full p-2.5 border rounded focus:border-green-500 outline-none text-sm" value={pax.document} onChange={e => updatePassenger(idx, 'document', e.target.value)} />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button onClick={() => removePassenger(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            <button onClick={addPassenger} className="mt-2 text-green-600 font-bold flex items-center gap-2 hover:bg-green-50 px-4 py-2 rounded-lg">
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
              <h2 className="text-xl font-bold text-gray-800">Enviar Manifesto por E-mail</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail do Destinatário</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                placeholder="motorista@email.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
              />
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
