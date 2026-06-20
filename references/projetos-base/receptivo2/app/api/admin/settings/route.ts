import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('system_settings').select('*').single();
    if (error) throw error;

    // Mascarar credenciais sensíveis antes de enviar ao client
    return NextResponse.json({
      ...data,
      stripe_secret_key:          data.stripe_secret_key          ? 'sk_live_***'  : '',
      stripe_webhook_secret:      data.stripe_webhook_secret      ? 'whsec_***'    : '',
      smtp_pass:                  data.smtp_pass                  ? '***'           : '',
      meta_conversions_api_token: data.meta_conversions_api_token ? '***'           : '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    
    // Removemos os campos que vieram mascarados (***) para não sobrescrever a senha real com asteriscos
    const updateData: any = { ...body };
    if (updateData.stripe_secret_key === 'sk_live_***') delete updateData.stripe_secret_key;
    if (updateData.stripe_webhook_secret === 'whsec_***') delete updateData.stripe_webhook_secret;
    if (updateData.smtp_pass === '***') delete updateData.smtp_pass;
    if (updateData.meta_conversions_api_token === '***') delete updateData.meta_conversions_api_token;

    const { error } = await supabaseAdmin.from('system_settings').update(updateData).eq('id', 1);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
