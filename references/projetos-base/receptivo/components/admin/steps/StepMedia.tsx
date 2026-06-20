import React, { useState } from 'react';
import { Tour } from '@/types';
import { UploadService } from '@/services/uploadService';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';

export default function StepMedia({ data, update }: { data: Partial<Tour>, update: (d: any) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const url = await UploadService.uploadImage(e.target.files[0]);
    if (url) {
      if (isGallery) {
        update({ gallery: [...(data.gallery || []), url] });
      } else {
        update({ image: url });
      }
    }
    setUploading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <label className="block text-sm font-bold mb-3 flex items-center gap-2">
            <ImageIcon size={18}/> Imagem de Capa
        </label>
        <div className="flex items-start gap-6">
          <label className={`cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary p-6 rounded-xl flex flex-col items-center gap-2 transition-colors w-40 h-40 justify-center ${uploading ? 'bg-gray-50' : ''}`}>
            <Upload className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">{uploading ? 'Enviando...' : 'Carregar'}</span>
            <input type="file" className="hidden" onChange={e => handleUpload(e, false)} />
          </label>
          {data.image ? (
            <div className="relative h-40 w-60">
                 <img src={data.image} className="h-full w-full object-cover rounded-xl shadow-md border" alt="Capa" />
                 <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
            </div>
          ) : (
            <div className="h-40 w-60 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm border">Sem imagem</div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-3">Galeria de Fotos</label>
        <div className="flex flex-wrap gap-4">
           {data.gallery?.map((url, idx) => (
             <div key={idx} className="relative group">
               <img src={url} className="w-24 h-24 object-cover rounded-lg border shadow-sm" />
               <button 
                onClick={() => update({ gallery: data.gallery?.filter((_, i) => i !== idx) })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
               >
                 <X size={12} />
               </button>
             </div>
           ))}
           <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary w-24 h-24 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-primary transition bg-gray-50 hover:bg-white">
              <Plus size={24} />
              <input type="file" className="hidden" onChange={e => handleUpload(e, true)} />
           </label>
        </div>
      </div>
    </div>
  );
}