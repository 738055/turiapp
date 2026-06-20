'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ClipboardList, Users } from 'lucide-react';
import EscalaOSWizard from '@/components/Admin/wizards/EscalaOSWizard';
import AgendaPaxWizard from '@/components/Admin/wizards/AgendaPaxWizard';
import ManifestoWizard from '@/components/Admin/wizards/ManifestoWizard';

type DocType = 'os' | 'agenda' | 'manifesto';

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<DocType | null>(null);

  if (docType === 'os') return <EscalaOSWizard mode="create" />;
  if (docType === 'agenda') return <AgendaPaxWizard mode="create" />;
  if (docType === 'manifesto') return <ManifestoWizard mode="create" />;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Novo Documento</h1>
          <p className="text-gray-500 text-sm mt-1">Selecione o tipo de documento que deseja criar</p>
        </div>
        <button
          onClick={() => router.push('/admin/operations')}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* OS / Escala */}
        <button
          onClick={() => setDocType('os')}
          className="bg-white border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all group"
        >
          <div className="bg-primary-100 text-primary-600 rounded-xl p-3 w-fit mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <FileText size={28} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">Ordem de Servico / Escala</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Escala do guia/motorista com lista de pick-ups, veiculos e rota do dia.
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded">Dados Gerais</span>
            <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded">Pick-ups</span>
            <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded">Alocacao</span>
          </div>
        </button>

        {/* Agenda PAX */}
        <button
          onClick={() => setDocType('agenda')}
          className="bg-white border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all group"
        >
          <div className="bg-teal-100 text-teal-600 rounded-xl p-3 w-fit mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <ClipboardList size={28} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">Agenda do Passageiro</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Cronograma de servicos do passageiro com datas, horarios e modalidade.
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded">Titular</span>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded">Cronograma</span>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-2 py-0.5 rounded">Guia</span>
          </div>
        </button>

        {/* Manifesto */}
        <button
          onClick={() => setDocType('manifesto')}
          className="bg-white border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all group"
        >
          <div className="bg-amber-100 text-amber-600 rounded-xl p-3 w-fit mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Users size={28} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">Manifesto de Fronteira</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Lista de passageiros com documentos para controle de fronteira (Argentina/Paraguai).
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Travessia</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Passageiros</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Veiculo</span>
          </div>
        </button>
      </div>
    </div>
  );
}
