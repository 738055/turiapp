// a10receptivo2.0/services/faqService.ts
import { supabase } from '@/lib/supabaseClient';
import { Faq } from '@/types';

export const FaqService = {
  async getAll() {
    if (!supabase) return [];
    // Usamos alias (isActive:is_active) para renomear o campo vindo do banco
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        id,
        question,
        answer,
        isActive:is_active,
        createdAt:created_at
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching FAQs:', error);
      return [];
    }
    return data as Faq[];
  },

  async getActive() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        id,
        question,
        answer,
        isActive:is_active,
        createdAt:created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active FAQs:', error);
      return [];
    }
    return data as Faq[];
  },

  async getById(id: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        id,
        question,
        answer,
        isActive:is_active,
        createdAt:created_at
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching FAQ:', error);
      return null;
    }
    return data as Faq;
  },

  async save(faq: Partial<Faq>) {
    if (!supabase) return null;
    
    // Mapeia de volta para o formato do banco de dados (snake_case)
    const dbData = {
      question: faq.question,
      answer: faq.answer,
      is_active: faq.isActive // Garante que o valor booleano seja salvo
    };

    if (faq.id) {
      const { data, error } = await supabase
        .from('faqs')
        .update(dbData)
        .eq('id', faq.id)
        .select(`
          id,
          question,
          answer,
          isActive:is_active,
          createdAt:created_at
        `)
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('faqs')
        .insert([dbData])
        .select(`
          id,
          question,
          answer,
          isActive:is_active,
          createdAt:created_at
        `)
        .single();
      if (error) throw error;
      return data;
    }
  },

  async delete(id: string) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting FAQ:', error);
      return false;
    }
    return true;
  }
};