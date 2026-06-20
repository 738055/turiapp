// services/agencyService.ts
import { supabase } from '@/lib/supabaseClient';
import { Agency } from '../types';

const mapFromDb = (row: any): Agency => ({
  id: row.id,
  name: row.name,
  cnpj: row.cnpj || '',
  email: row.email || '',
  phone: row.phone || '',
  whatsapp: row.whatsapp || '',
  address: row.address || '',
  city: row.city || '',
  state: row.state || 'PR',
  contactPerson: row.contact_person || '',
  isActive: row.is_active,
  notes: row.notes || '',
  createdAt: row.created_at,
});

const mapToDb = (agency: Partial<Agency>) => {
  const payload: any = {
    name: agency.name,
    cnpj: agency.cnpj || null,
    email: agency.email || null,
    phone: agency.phone || null,
    whatsapp: agency.whatsapp || null,
    address: agency.address || null,
    city: agency.city || null,
    state: agency.state || null,
    contact_person: agency.contactPerson || null,
    is_active: agency.isActive,
    notes: agency.notes || null,
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  return payload;
};

export const AgencyService = {
  getAll: async (): Promise<Agency[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('name', { ascending: true });
    if (error) { console.error('AgencyService.getAll:', error); return []; }
    return (data || []).map(mapFromDb);
  },

  getActive: async (): Promise<Agency[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) { console.error('AgencyService.getActive:', error); return []; }
    return (data || []).map(mapFromDb);
  },

  getById: async (id: string): Promise<Agency | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase.from('agencies').select('*').eq('id', id).single();
    if (error) return undefined;
    return mapFromDb(data);
  },

  create: async (agency: Omit<Agency, 'id' | 'createdAt'>): Promise<Agency> => {
    if (!supabase) return { ...agency, id: 'temp-' + Date.now() } as Agency;
    const { data, error } = await supabase
      .from('agencies')
      .insert([mapToDb(agency)])
      .select()
      .single();
    if (error) throw error;
    return mapFromDb(data);
  },

  update: async (id: string, updates: Partial<Agency>): Promise<Agency> => {
    if (!supabase) return { id, ...updates } as Agency;
    const { data, error } = await supabase
      .from('agencies')
      .update(mapToDb(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('agencies').delete().eq('id', id);
    if (error) throw error;
  },
};
