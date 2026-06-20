'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/app/types';
import TourWizard from './TourWizard';
import AirportTransferWizard from './AirportTransferWizard';
import ProductFormClient from '@/components/Admin/ProductFormClient';
import { Plane, Map, Ticket, Package, ArrowLeft } from 'lucide-react';

type ProductTypeChoice = 'tour' | 'airport_transfer' | 'ticket' | 'package';

interface ProductFormWrapperProps {
  initialData?: Product | null;
  mode: 'create' | 'edit';
}

function detectInitialType(product: Product | null | undefined): ProductTypeChoice | null {
  if (!product) return null;
  if (product.type === 'transfer' && product.transferDetails?.transferCategory === 'airport') {
    return 'airport_transfer';
  }
  if (product.type === 'ticket') return 'ticket';
  if (product.type === 'package') return 'package';
  return 'tour';
}

const TYPE_OPTIONS: { id: ProductTypeChoice; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'tour',
    label: 'Passeio / Atrativo',
    description: 'Tours, passeios em grupo, experiências culturais e natureza.',
    icon: <Map size={32} />,
    color: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  },
  {
    id: 'airport_transfer',
    label: 'Transfer Aeroporto',
    description: 'Translados entre aeroporto e hotéis, com configuração de trechos e veículos.',
    icon: <Plane size={32} />,
    color: 'border-purple-400 bg-purple-50 text-purple-700',
  },
  {
    id: 'ticket',
    label: 'Ingresso / Atração',
    description: 'Ingressos para parques, shows, eventos e atrações turísticas.',
    icon: <Ticket size={32} />,
    color: 'border-primary-400 bg-primary-50 text-primary-700',
  },
  {
    id: 'package',
    label: 'Pacote',
    description: 'Combinações de serviços: hotel + passeio, ingresso + transfer, etc.',
    icon: <Package size={32} />,
    color: 'border-orange-400 bg-orange-50 text-orange-700',
  },
];

export default function ProductFormWrapper({ initialData, mode }: ProductFormWrapperProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ProductTypeChoice | null>(
    detectInitialType(initialData),
  );

  // Em modo edição, pula a seleção de tipo e vai direto ao wizard correto
  if (mode === 'edit' && selectedType) {
    return <WizardRenderer type={selectedType} initialData={initialData} mode={mode} />;
  }

  // Tela de seleção de tipo (Passo 1 do Wrapper)
  if (!selectedType) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Novo Produto</h1>
              <p className="text-gray-500 text-sm mt-1">Passo 1 — Qual tipo de produto deseja cadastrar?</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft size={16} /> Cancelar
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-4">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedType(opt.id)}
                  className={`text-left border-2 rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5 ${opt.color}`}
                >
                  <div className="mb-3">{opt.icon}</div>
                  <h3 className="text-lg font-bold mb-1">{opt.label}</h3>
                  <p className="text-sm opacity-80 leading-snug">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <WizardRenderer type={selectedType} initialData={initialData} mode={mode} />;
}

function WizardRenderer({
  type,
  initialData,
  mode,
}: {
  type: ProductTypeChoice;
  initialData?: Product | null;
  mode: 'create' | 'edit';
}) {
  switch (type) {
    case 'tour':
      return <TourWizard initialData={initialData} mode={mode} />;
    case 'airport_transfer':
      return <AirportTransferWizard initialData={initialData} mode={mode} />;
    case 'ticket':
    case 'package':
      // Fallback para o form genérico, passando o tipo pré-definido
      return <ProductFormClient initialData={initialData ? initialData : ({ type } as any)} mode={mode} />;
    default:
      return null;
  }
}
