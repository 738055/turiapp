// a10receptivo2.0/services/uploadService.ts
import { supabase } from '@/lib/supabaseClient';

export const UploadService = {
  uploadImage: async (file: File, folder: string = 'posts'): Promise<string> => {
    if (!supabase) throw new Error("Supabase client not initialized");

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Upload para o bucket 'images'
    const { error: uploadError } = await supabase.storage
      .from('images') 
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Gerar URL pública
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
};