// a10receptivo2.0/components/admin/PostEditor.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost, LocalizedContent } from '@/types';
import { TourService } from '@/services/tourService';
import { UploadService } from '@/services/uploadService';
import Button from '@/components/Button';
import { Save, ArrowLeft, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface PostEditorProps {
  initialData?: Partial<BlogPost>;
  isEditMode?: boolean;
}

export default function PostEditor({ initialData, isEditMode = false }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<BlogPost>>(initialData || {
    title: { pt: '', en: '', es: '' },
    shortDesc: { pt: '', en: '', es: '' },
    content: { pt: '', en: '', es: '' },
    imageUrl: '',
    isActive: true,
  });

  const handleChange = (field: keyof BlogPost, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalizedChange = (field: 'title' | 'shortDesc' | 'content', lang: keyof LocalizedContent, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field] as LocalizedContent,
        [lang]: value
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await UploadService.uploadImage(file, 'blog');
      handleChange('imageUrl', publicUrl);
    } catch (error: any) {
      console.error("Erro no upload:", error);
      alert(`Erro ao fazer upload: ${error.message || 'Verifique se o bucket "images" existe e é público no Supabase.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let slug = formData.slug;
      if (!slug && formData.title?.pt) {
         slug = formData.title.pt.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-');
      }

      await TourService.savePost({ ...formData, slug });
      router.push('/admin/posts');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4 z-10">
        <div className="flex items-center gap-4">
             <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
             </button>
             <div>
                <h1 className="text-xl font-bold text-gray-800 leading-none">
                  {isEditMode ? 'Editar Publicação' : 'Nova Publicação'}
                </h1>
                <p className="text-xs text-gray-400 mt-1">Gerencie o conteúdo do carrossel informativo</p>
             </div>
        </div>
        <div className="flex gap-3">
             <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
             <Button disabled={loading || uploading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2"/>}
                {loading ? 'Salvando...' : 'Salvar Publicação'}
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Mídia e Configurações */}
        <div className="space-y-6">
            {/* Upload de Imagem */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <ImageIcon size={16}/> Imagem de Capa
                </h3>
                
                <div className="group relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden min-h-[200px] flex flex-col items-center justify-center text-center">
                    {formData.imageUrl ? (
                        <>
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium text-sm">Clique para alterar</p>
                            </div>
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleChange('imageUrl', ''); }}
                                className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow-md hover:bg-white transition-colors z-20"
                            >
                                <X size={14} /> 
                            </button>
                        </>
                    ) : (
                        <div className="p-6">
                            {uploading ? (
                                <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                            ) : (
                                <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-gray-500 font-medium">
                                {uploading ? 'Enviando...' : 'Arraste ou clique para upload'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP</p>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Visibilidade</h3>
                <label className="flex items-center gap-4 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={formData.isActive} 
                          onChange={e => handleChange('isActive', e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block text-sm">Post Ativo</span>
                        <span className="text-xs text-gray-500">Visível para os visitantes</span>
                    </div>
                </label>
            </div>
        </div>

        {/* Coluna Direita: Conteúdo */}
        <div className="lg:col-span-2 space-y-6">
            {/* Português (Principal) */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                        <span>🇧🇷</span> Português <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Principal</span>
                    </h3>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Título do Post</label>
                        <input 
                          value={formData.title?.pt} 
                          onChange={e => handleLocalizedChange('title', 'pt', e.target.value)}
                          className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 text-lg"
                          placeholder="Ex: Passeio de Helicóptero"
                          required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Descrição Curta</label>
                        <textarea 
                          value={formData.shortDesc?.pt} 
                          onChange={e => handleLocalizedChange('shortDesc', 'pt', e.target.value)}
                          className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-24 text-sm resize-none"
                          placeholder="Um breve resumo que aparecerá no card..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Conteúdo Completo (HTML)</label>
                        <textarea 
                          value={formData.content?.pt} 
                          onChange={e => handleLocalizedChange('content', 'pt', e.target.value)}
                          className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-64 font-mono text-sm leading-relaxed"
                          placeholder="<p>Escreva os detalhes completos aqui...</p>"
                        />
                    </div>
                </div>
            </div>

            {/* Traduções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inglês */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <span>🇺🇸</span> English Translation
                    </h3>
                    <div className="space-y-3">
                        <input 
                            placeholder="Title"
                            value={formData.title?.en} 
                            onChange={e => handleLocalizedChange('title', 'en', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:border-gray-400 outline-none"
                        />
                        <textarea 
                            placeholder="Short Description"
                            value={formData.shortDesc?.en} 
                            onChange={e => handleLocalizedChange('shortDesc', 'en', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:border-gray-400 outline-none h-20 resize-none"
                        />
                        <textarea 
                            placeholder="Content (HTML)"
                            value={formData.content?.en} 
                            onChange={e => handleLocalizedChange('content', 'en', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm font-mono focus:border-gray-400 outline-none h-32"
                        />
                    </div>
                </div>

                {/* Espanhol */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <span>🇪🇸</span> Traducción al Español
                    </h3>
                    <div className="space-y-3">
                        <input 
                            placeholder="Título"
                            value={formData.title?.es} 
                            onChange={e => handleLocalizedChange('title', 'es', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:border-gray-400 outline-none"
                        />
                        <textarea 
                            placeholder="Descripción Corta"
                            value={formData.shortDesc?.es} 
                            onChange={e => handleLocalizedChange('shortDesc', 'es', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:border-gray-400 outline-none h-20 resize-none"
                        />
                        <textarea 
                            placeholder="Contenido (HTML)"
                            value={formData.content?.es} 
                            onChange={e => handleLocalizedChange('content', 'es', e.target.value)}
                            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm font-mono focus:border-gray-400 outline-none h-32"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </form>
  );
}