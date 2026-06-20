// a10receptivo2.0/services/categoryService.ts
import { supabase } from '@/lib/supabaseClient';
import { Category } from '../types';

// Mocks para fallback caso o banco falhe
const MOCK_CATEGORIES: Category[] = [
    { 
        id: '1', 
        slug: 'cataratas', 
        name: { pt: 'Cataratas', en: 'Falls', es: 'Cataratas' }, 
        isActive: true 
    },
    { 
        id: '2', 
        slug: 'compras', 
        name: { pt: 'Compras', en: 'Shopping', es: 'Compras' }, 
        isActive: true 
    }
];

// --- Helpers de Mapeamento ---

const mapFromDb = (row: any): Category => ({
    id: row.id,
    slug: row.slug,
    name: row.name || { pt: '', en: '', es: '' },
    isActive: row.is_active // Converte snake_case (DB) para camelCase (App)
});

const mapToDb = (cat: Partial<Category>) => {
    const payload: any = {
        slug: cat.slug,
        name: cat.name,
        is_active: cat.isActive
    };
    
    // Remove undefined para não sobrescrever com null se for update parcial
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
};

export const CategoryService = {
  
  getAll: async (): Promise<Category[]> => {
    if (supabase) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Supabase Error (Categories):", error);
            // Se a tabela não existir, retorna array vazio em vez de crashar
            return [];
        }
        return (data || []).map(mapFromDb);
    }
    return MOCK_CATEGORIES;
  },

  getById: async (id: string): Promise<Category | undefined> => {
      if(supabase) {
          const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
          if(error) return undefined;
          return mapFromDb(data);
      }
      return MOCK_CATEGORIES.find(c => c.id === id);
  },

  create: async (category: Omit<Category, 'id'>): Promise<Category> => {
      if(supabase) {
          const payload = mapToDb(category);
          const { data, error } = await supabase.from('categories').insert([payload]).select().single();
          if(error) throw error;
          return mapFromDb(data);
      }
      return { ...category, id: 'temp-' + Date.now() } as Category;
  },

  update: async (id: string, updates: Partial<Category>): Promise<Category> => {
      if(supabase) {
          const payload = mapToDb(updates);
          const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
          if(error) throw error;
          return mapFromDb(data);
      }
      return { id, ...updates } as Category;
  },

  delete: async (id: string): Promise<void> => {
      if(supabase) {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if(error) throw error;
      }
  }
};