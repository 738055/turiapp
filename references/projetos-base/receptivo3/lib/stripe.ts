// lib/stripe.ts
// Helper centralizado para instanciar o cliente Stripe.
// A chave secreta é lida de `system_settings` (configurada no ERP),
// com fallback para a variável de ambiente STRIPE_SECRET_KEY.

import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const STRIPE_API_VERSION = '2023-10-16' as const;

export async function getStripe(): Promise<Stripe> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: settings } = await supabaseAdmin
    .from('system_settings')
    .select('stripe_secret_key')
    .single();

  const secretKey = settings?.stripe_secret_key || process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe secret key não configurada (system_settings nem STRIPE_SECRET_KEY).');
  }

  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION as any });
}
