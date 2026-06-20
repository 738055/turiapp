'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaqService } from '@/services/faqService';
import { Faq } from '@/types';
import { autoFillTranslations } from '@/utils/autoTranslate'; // Assumindo que essa função existe
import Button from '@/components/Button';
import { Save, ArrowLeft, Wand2 } from 'lucide-react';

export default function FaqEditor({ initialData }: { initialData?: Partial<Faq> }) {
  const router = useRouter();
  const [data, setData] = useState<Partial<Faq>>(initialData || {
      question: { pt: '', en: '', es: '' },
      answer: { pt: '', en: '', es: '' },
      isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pt' | 'en' | 'es'>('pt');

  const handleAutoTranslate = async () => {
      if(!data.question?.pt || !data.answer?.pt) {
          alert("Preencha a pergunta e resposta em Português primeiro.");
          return;
      }
      
      const qTranslated = await autoFillTranslations(data.question.pt, data.question.en, data.question.es);
      const aTranslated = await autoFillTranslations(data.answer.pt, data.answer.en, data.answer.es);
      
      setData(prev => ({ 
          ...prev, 
          question: { pt: prev.question!.pt, ...qTranslated },
          answer: { pt: prev.answer!.pt, ...aTranslated }
      }));
  };

  const handleSave = async () => {
      setSaving(true);
      await FaqService.save(data);
      setSaving(false);
      router.push('/admin/faq');
  };

  const tabs = [
      { id: 'pt', label: '🇧🇷 Português' },
      { id: 'en', label: '🇺🇸 Inglês' },
      { id: 'es', label: '🇪🇸 Espanhol' }
  ] as const;

  return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-800">{initialData ? 'Editar Pergunta' : 'Nova Pergunta'}</h1>
              <Button variant="outline" onClick={() => router.back()} className="text-sm"><ArrowLeft size={16}/> Voltar</Button>
          </div>

          <div className="flex gap-2 mb-6 border-b">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>

          <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">Pergunta ({activeTab.toUpperCase()})</label>
                  <input 
                    value={data.question?.[activeTab]} 
                    onChange={e => setData({...data, question: {...data.question!, [activeTab]: e.target.value}})}
                    className="w-full border border-gray-300 p-3 rounded-lg font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: Qual a melhor época para visitar?"
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">Resposta ({activeTab.toUpperCase()})</label>
                  <textarea 
                    rows={5}
                    value={data.answer?.[activeTab]} 
                    onChange={e => setData({...data, answer: {...data.answer!, [activeTab]: e.target.value}})}
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: A melhor época é..."
                  />
              </div>
              
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={data.isActive}
                    onChange={e => setData({...data, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Pergunta Ativa (Visível no site)</label>
              </div>

              <div className="flex gap-3 pt-6 border-t mt-4">
                  <button onClick={handleAutoTranslate} className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition font-medium text-sm">
                      <Wand2 size={16}/> Traduzir Automaticamente
                  </button>
                  <div className="flex-1"></div>
                  <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Salvando...' : <span className="flex items-center gap-2"><Save size={18}/> Salvar FAQ</span>}
                  </Button>
              </div>
          </div>
      </div>
  );
}