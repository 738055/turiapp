// services/voucherService.ts
import { supabase } from '@/lib/supabaseClient';
import {
  Voucher,
  VoucherFull,
  VoucherItem,
  VoucherPax,
  VoucherWithTotals,
  VoucherCreateInput,
  VoucherStatus,
} from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const generateVoucherNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `A10-${year}${month}-${rand}`;
};

const mapPaxFromDb = (row: any): VoucherPax => ({
  id: row.id,
  voucherItemId: row.voucher_item_id,
  paxType: row.pax_type,
  quantity: row.quantity,
  pricePerPax: Number(row.price_per_pax),
});

const mapItemFromDb = (row: any): VoucherItem => ({
  id: row.id,
  voucherId: row.voucher_id,
  serviceName: row.service_name,
  serviceType: row.service_type,
  sortOrder: row.sort_order || 0,
  pax: (row.voucher_pax || []).map(mapPaxFromDb),
});

const mapVoucherFromDb = (row: any): VoucherWithTotals => ({
  id: row.id,
  voucherNumber: row.voucher_number,
  companyId: row.company_id || undefined,
  companyName: row.company_name || 'A10 Receptivo',
  companyLanguage: (row.company_language as 'pt' | 'en') || 'pt',
  agencyId: row.agency_id || undefined,
  agencyName: row.agency_name,
  holderName: row.holder_name,
  serviceDate: row.service_date || undefined,
  hotel: row.hotel || undefined,
  pickupTime: row.pickup_time || undefined,
  notes: row.notes || undefined,
  amountPaid: Number(row.amount_paid),
  status: row.status as VoucherStatus,
  totalAmount: Number(row.total_amount || 0),
  remainingBalance: Number(row.remaining_balance || 0),
  totalPax: Number(row.total_pax || 0),
  createdAt: row.created_at,
});

// ─── Service ───────────────────────────────────────────────────────────────────

export const VoucherService = {
  getAll: async (): Promise<VoucherWithTotals[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('vouchers_with_totals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('VoucherService.getAll:', error); return []; }
    return (data || []).map(mapVoucherFromDb);
  },

  getById: async (id: string): Promise<VoucherFull | undefined> => {
    if (!supabase) return undefined;

    const { data: v, error: vErr } = await supabase
      .from('vouchers_with_totals')
      .select('*')
      .eq('id', id)
      .single();
    if (vErr) return undefined;

    const { data: items, error: iErr } = await supabase
      .from('voucher_items')
      .select('*, voucher_pax(*)')
      .eq('voucher_id', id)
      .order('sort_order', { ascending: true });
    if (iErr) console.error('VoucherService items fetch:', iErr);

    return {
      ...mapVoucherFromDb(v),
      items: (items || []).map(mapItemFromDb),
    };
  },

  create: async (input: VoucherCreateInput): Promise<VoucherFull> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const voucherNumber = generateVoucherNumber();

    const { data: v, error: vErr } = await supabase
      .from('vouchers')
      .insert([{
        voucher_number: voucherNumber,
        company_id: input.companyId || null,
        company_name: input.companyName,
        company_language: input.companyLanguage || 'pt',
        agency_id: input.agencyId || null,
        agency_name: input.agencyName,
        holder_name: input.holderName,
        service_date: input.serviceDate || null,
        hotel: input.hotel || null,
        pickup_time: input.pickupTime || null,
        notes: input.notes || null,
        amount_paid: input.amountPaid,
        status: 'active',
      }])
      .select()
      .single();

    if (vErr) throw vErr;

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];

      const { data: itemData, error: iErr } = await supabase
        .from('voucher_items')
        .insert([{
          voucher_id: v.id,
          service_name: item.serviceName,
          service_type: item.serviceType,
          sort_order: i,
        }])
        .select()
        .single();

      if (iErr) throw iErr;

      if (item.paxEntries.length > 0) {
        const paxRows = item.paxEntries.map(p => ({
          voucher_item_id: itemData.id,
          pax_type: p.paxType,
          quantity: p.quantity,
          price_per_pax: p.pricePerPax,
        }));
        const { error: pErr } = await supabase.from('voucher_pax').insert(paxRows);
        if (pErr) throw pErr;
      }
    }

    const result = await VoucherService.getById(v.id);
    if (!result) throw new Error('Erro ao recuperar voucher criado');
    return result;
  },

  updateStatus: async (id: string, status: VoucherStatus): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('vouchers').update({ status }).eq('id', id);
    if (error) throw error;
  },

  updateAmountPaid: async (id: string, amountPaid: number): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
      .from('vouchers')
      .update({ amount_paid: amountPaid })
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) throw error;
  },
};
