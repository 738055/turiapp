'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tour, LocalizedContent, LocalizedArray, ItineraryItem } from '@/types';
import { TourService } from '@/services/tourService';
import { autoFillTranslations } from '@/utils/autoTranslate';
import { ChevronRight, ChevronLeft, Save, Loader2, Wand2 } from 'lucide-react';
import Button from '@/components/Button';

// Passos
import StepBasic from './steps/StepBasic';
import StepMedia from './steps/StepMedia';
import StepDetails from './steps/StepDetails';
import StepPricing from './steps/StepPricing';

interface ExperienceWizardProps {
  initialData?: Partial<Tour>;
  isEditMode?: boolean;
}

const STEPS = [
  { id: 'basic', label: '1. Básico & Tradução' },
  { id: 'media', label: '2. Mídia & Galeria' },
  { id: 'details', label: '3. Detalhes & Roteiro' },
  { id: 'pricing', label: '4. Preços & Tiers' },
];

export default function ExperienceWizard({ initialData, isEditMode = false }: ExperienceWizardProps) {
  const router = useRouter();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false); // Estado de loading para tradução
  
  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Tour>>(initialData || {
    title: { pt: '', en: '', es: '' },
    description: { pt: '', en: '', es: '' },
    fullDescription: { pt: '', en: '', es: '' },
    location: { pt: 'Foz do Iguaçu, BR', en: 'Foz do Iguaçu, BR', es: 'Foz do Iguaçu, BR' },
    highlights: { pt: [], en: [], es: [] },
    included: { pt: [], en: [], es: [] },
    notIncluded: { pt: [], en: [], es: [] },
    itinerary: [],
    seasonalRules: [],
    vehicleTiers: [],
    gallery: [],
    status: 'draft',
    pricingType: 'per_person',
    basePrice: 0,
    seo: { metaTitle: {pt:'',en:'',es:''}, metaDescription: {pt:'',en:'',es:''} }
  });

  const updateForm = (updates: Partial<Tour>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // --- LÓGICA DE TRADUÇÃO COMPLETA ---
  const handleAutoTranslate = async () => {
    if (!formData.title?.pt) return alert("Preencha o título em Português primeiro.");
    
    setTranslating(true);
    try {
        // 1. Campos Básicos
        const title = await autoFillTranslations(formData.title.pt, formData.title.en, formData.title.es);
        const desc = await autoFillTranslations(formData.description?.pt || '', formData.description?.en || '', formData.description?.es || '');
        const fullDesc = await autoFillTranslations(formData.fullDescription?.pt || '', formData.fullDescription?.en || '', formData.fullDescription?.es || '');
        const loc = await autoFillTranslations(formData.location?.pt || '', formData.location?.en || '', formData.location?.es || '');

        // 2. Arrays de Texto (Highlights, Included, NotIncluded)
        const translateArray = async (sourceArr: string[], currentEn: string[], currentEs: string[]) => {
            const newEn = [...currentEn];
            const newEs = [...currentEs];
            for (let i = 0; i < sourceArr.length; i++) {
                if (sourceArr[i]) {
                    const t = await autoFillTranslations(sourceArr[i], newEn[i], newEs[i]);
                    newEn[i] = t.en;
                    newEs[i] = t.es;
                }
            }
            return { en: newEn, es: newEs };
        };

        const highlightsTrans = await translateArray(
            formData.highlights?.pt || [], 
            formData.highlights?.en || [], 
            formData.highlights?.es || []
        );

        const includedTrans = await translateArray(
            formData.included?.pt || [], 
            formData.included?.en || [], 
            formData.included?.es || []
        );

        const notIncludedTrans = await translateArray(
            formData.notIncluded?.pt || [], 
            formData.notIncluded?.en || [], 
            formData.notIncluded?.es || []
        );

        // 3. Roteiro (Itinerary)
        const newItinerary = [...(formData.itinerary || [])];
        for (let i = 0; i < newItinerary.length; i++) {
            const item = newItinerary[i];
            if (item.activity?.pt) {
                const t = await autoFillTranslations(item.activity.pt, item.activity.en, item.activity.es);
                newItinerary[i] = {
                    ...item,
                    activity: { pt: item.activity.pt, en: t.en, es: t.es }
                };
            }
        }

        // Atualiza tudo de uma vez
        updateForm({
            title: { pt: formData.title.pt, ...title },
            description: { pt: formData.description?.pt || '', ...desc },
            fullDescription: { pt: formData.fullDescription?.pt || '', ...fullDesc },
            location: { pt: formData.location?.pt || '', ...loc },
            highlights: { 
                pt: formData.highlights?.pt || [], 
                en: highlightsTrans.en, 
                es: highlightsTrans.es 
            },
            included: { 
                pt: formData.included?.pt || [], 
                en: includedTrans.en, 
                es: includedTrans.es 
            },
            notIncluded: { 
                pt: formData.notIncluded?.pt || [], 
                en: notIncludedTrans.en, 
                es: notIncludedTrans.es 
            },
            itinerary: newItinerary
        });

        alert("Traduções automáticas geradas para todos os campos!");

    } catch (error) {
        console.error("Erro na tradução", error);
        alert("Erro ao traduzir. Verifique o console.");
    } finally {
        setTranslating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tourToSave = { ...formData };
      
      if (!tourToSave.slug && tourToSave.title?.pt) {
        tourToSave.slug = tourToSave.title.pt.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-');
      }

      if (isEditMode && tourToSave.id) {
        await TourService.update(tourToSave.id, tourToSave);
      } else {
        await TourService.create(tourToSave as Tour);
      }
      
      router.refresh(); 
      router.push('/admin/experiences');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? `Editar: ${formData.title?.pt}` : 'Nova Experiência'}
        </h1>
        <div className="flex gap-2">
            <button 
              onClick={handleAutoTranslate}
              disabled={translating}
              className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition border border-purple-100 disabled:opacity-50"
            >
              {translating ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16} />} 
              {translating ? 'Traduzindo...' : 'Auto-Traduzir Tudo'}
            </button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2"/> Salvar</>}
            </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-between relative mb-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStepIdx;
          const isCompleted = idx < currentStepIdx;
          return (
            <button 
              key={step.id} 
              onClick={() => setCurrentStepIdx(idx)}
              className={`flex flex-col items-center gap-2 bg-white px-4 z-10 ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                isActive ? 'bg-primary text-white shadow-lg' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-xs font-bold uppercase ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step.label}</span>
            </button>
          )
        })}
      </div>

      {/* Steps Content */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 min-h-[400px]">
        {currentStepIdx === 0 && <StepBasic data={formData} update={updateForm} />}
        {currentStepIdx === 1 && <StepMedia data={formData} update={updateForm} />}
        {currentStepIdx === 2 && <StepDetails data={formData} update={updateForm} />}
        {currentStepIdx === 3 && <StepPricing data={formData} update={updateForm} />}
      </div>

      {/* Footer Nav */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={() => setCurrentStepIdx(p => Math.max(0, p - 1))} 
          disabled={currentStepIdx === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
        >
          <ChevronLeft size={20} /> Voltar
        </button>
        
        {currentStepIdx < STEPS.length - 1 ? (
          <Button onClick={() => setCurrentStepIdx(p => Math.min(STEPS.length - 1, p + 1))} className="flex items-center gap-2">
            Próximo <ChevronRight size={20} />
          </Button>
        ) : (
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <Save size={18} /> Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}