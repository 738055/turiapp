import { supabase } from '@/lib/supabaseClient';
import { AppSetting } from '@/types';

export const SettingsService = {
  // Busca todas as configurações (usado para listar no painel admin)
  getAll: async (): Promise<AppSetting[]> => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('label');
      
    if (error) {
      console.error('Error fetching settings:', error);
      return [];
    }
    return data || [];
  },

  // Atualiza uma configuração específica pela chave (key)
  update: async (key: string, value: string): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from('app_settings')
      .update({ 
        value, 
        // @ts-ignore: ignora erro de tipo se o campo updated_at não estiver definido na tipagem do banco gerada, mas é boa prática ter
        updated_at: new Date().toISOString() 
      })
      .eq('key', key);

    if (error) throw error;
  },
  
  // Retorna um mapa simples { chave: valor } para acesso rápido (usado no Analytics e Pixel)
  getSettingsMap: async (): Promise<Record<string, string>> => {
     if (!supabase) return {};

     const { data, error } = await supabase
       .from('app_settings')
       .select('key, value');

    if (error) {
      console.error('Error fetching settings map:', error);
      return {};
    }

    return (data || []).reduce((acc, item) => {
      if (item.key && item.value) {
        acc[item.key] = item.value;
      }
      return acc;
    }, {} as Record<string, string>);
  }
};