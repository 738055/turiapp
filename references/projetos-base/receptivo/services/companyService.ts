// services/companyService.ts
import { supabase } from '@/lib/supabaseClient';
import { Company } from '../types';

const mapFromDb = (row: any): Company => ({
  id: row.id,
  name: row.name,
  cnpj: row.cnpj || '',
  email: row.email || '',
  phone: row.phone || '',
  whatsapp: row.whatsapp || '',
  address: row.address || '',
  city: row.city || '',
  state: row.state || 'PR',
  logoUrl: row.logo_url || '',
  language: (row.language as 'pt' | 'en') || 'pt',
  primaryColor: row.primary_color || '#0A6640',
  isActive: row.is_active,
  createdAt: row.created_at,
});

const mapToDb = (c: Partial<Company>) => {
  const payload: any = {
    name: c.name,
    cnpj: c.cnpj || null,
    email: c.email || null,
    phone: c.phone || null,
    whatsapp: c.whatsapp || null,
    address: c.address || null,
    city: c.city || null,
    state: c.state || null,
    logo_url: c.logoUrl || null,
    language: c.language,
    primary_color: c.primaryColor || '#0A6640',
    is_active: c.isActive,
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  return payload;
};

export const CompanyService = {
  getAll: async (): Promise<Company[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });
    if (error) { console.error('CompanyService.getAll:', error); return []; }
    return (data || []).map(mapFromDb);
  },

  getActive: async (): Promise<Company[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) { console.error('CompanyService.getActive:', error); return []; }
    return (data || []).map(mapFromDb);
  },

  getById: async (id: string): Promise<Company | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
    if (error) return undefined;
    return mapFromDb(data);
  },

  create: async (company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> => {
    if (!supabase) return { ...company, id: 'temp-' + Date.now() } as Company;
    const { data, error } = await supabase
      .from('companies')
      .insert([mapToDb(company)])
      .select()
      .single();
    if (error) throw error;
    return mapFromDb(data);
  },

  update: async (id: string, updates: Partial<Company>): Promise<Company> => {
    if (!supabase) return { id, ...updates } as Company;
    const { data, error } = await supabase
      .from('companies')
      .update(mapToDb(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapFromDb(data);
  },

  delete: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },
};
