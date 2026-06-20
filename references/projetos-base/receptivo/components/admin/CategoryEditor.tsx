// components/admin/CategoryEditor.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryService } from '@/services/categoryService';
import { Category } from '@/types';
import { Save, ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import { autoFillTranslations } from '@/utils/autoTranslate';
import Button from '@/components/Button';

interface CategoryEditorProps {
  initialData?: Category;
  isEditMode?: boolean;
}

export default function CategoryEditor({ initialData, isEditMode = false }: CategoryEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Estado local do formulário
  const [formData, setFormData] = useState<Partial<Category>>(initialData || {
      name: { pt: '', en: '', es: '' },
      slug: '',
      isActive: true
  });

  const updateName = (lang: 'pt'|'en'|'es', val: string) => {
      setFormData(prev => ({
          ...prev,
          name: { ...prev.name!, [lang]: val }
      }));
  };

  const handleAutoTranslate = async () => {
      if (!formData.name?.pt) return alert("Preencha o nome em Português.");
      
      setTranslating(true);
      try {
          const translations = await autoFillTranslations(
              formData.name.pt, 
              formData.name.en, 
              formData.name.es
          );
          
          setFormData(prev => ({
              ...prev,
              name: {
                  pt: prev.name!.pt,
                  en: translations.en,
                  es: translations.es
              }
          }));
      } catch (err) {
          console.error(err);
          alert("Erro na tradução.");
      } finally {
          setTranslating(false);
      }
  };

  const handleSave = async () => {
      if (!formData.name?.pt || !formData.slug) {
          return alert("Preencha o Nome (PT) e o Slug.");
      }

      setSaving(true);
      try {
          // Garante slug válido
          const cleanSlug = formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          
          const payload = {
              ...formData,
              slug: cleanSlug,
              // Garante que isActive não é undefined
              isActive: formData.isActive ?? true 
          };

          if (isEditMode && initialData?.id) {
              await CategoryService.update(initialData.id, payload);
          } else {
              await CategoryService.create(payload as Category);
          }

          // Força refresh para limpar cache do Next.js
          router.refresh();
          router.push('/admin/categories');
      } catch (error: any) {
          console.error("Erro ao salvar categoria:", error);
          alert(`Erro ao salvar: ${error.message || 'Verifique o console'}`);
      } finally {
          setSaving(false);
      }
  };

  // Gera slug automaticamente ao digitar o nome em PT (apenas na criação)
  const handleNameBlur = () => {
      if (!isEditMode && formData.name?.pt && !formData.slug) {
          const generatedSlug = formData.name.pt
              .toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
              .replace(/[^a-z0-9]+/g, '-') // Substitui espaços/símbolos por traço
              .replace(/^-+|-+$/g, ''); // Remove traços do início/fim
          
          setFormData(prev => ({ ...prev, slug: generatedSlug }));
      }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Editar Categoria' : 'Nova Categoria'}
                </h1>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition border border-purple-200"
                >
                    {translating ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                    Traduzir
                </button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin"/> : <><Save size={18} className="mr-2"/> Salvar</>}
                </Button>
            </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
            
            {/* Status & Slug */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                    <div className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50">
                        <input 
                            type="checkbox" 
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                        />
                        <span className={`text-sm font-bold ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {formData.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Slug (URL)</label>
                    <input 
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full border p-3 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-gray-600"
                        placeholder="ex: passeios-barco"
                    />
                </div>
            </div>

            <hr className="border-gray-100"/>

            {/* Nomes Traduzidos */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Nome (Português)</label>
                    <input 
                        value={formData.name?.pt}
                        onChange={(e) => updateName('pt', e.target.value)}
                        onBlur={handleNameBlur}
                        className="w-full border p-3 rounded-lg text-lg font-bold text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Ex: Aventura"
                        autoFocus
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-blue-600 mb-1">Nome (Inglês)</label>
                        <input 
                            value={formData.name?.en}
                            onChange={(e) => updateName('en', e.target.value)}
                            className="w-full border p-3 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-400"
                            placeholder="Ex: Adventure"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-orange-600 mb-1">Nome (Espanhol)</label>
                        <input 
                            value={formData.name?.es}
                            onChange={(e) => updateName('es', e.target.value)}
                            className="w-full border p-3 rounded-lg text-sm bg-gray-50 outline-none focus:border-orange-400"
                            placeholder="Ex: Aventura"
                        />
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}