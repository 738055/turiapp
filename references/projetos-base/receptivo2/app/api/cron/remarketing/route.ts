import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  // Segurança do Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Configurações de SMTP do Admin
  const { data: settings } = await supabaseAdmin.from('system_settings').select('smtp_host, smtp_port, smtp_user, smtp_pass').single();
  if (!settings || !settings.smtp_host) {
    return NextResponse.json({ error: 'SMTP não configurado.' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_port === 465,
    auth: { user: settings.smtp_user, pass: settings.smtp_pass }
  });

  // 2. Buscar o melhor cupom ativo no Admin dinamicamente
  const { data: bestCoupon } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('active', true)
    .eq('discount_type', 'percentage')
    .order('discount_value', { ascending: false })
    .limit(1)
    .single();

  const couponCode = bestCoupon ? bestCoupon.code : 'ESPECIAL';
  const discountValue = bestCoupon ? bestCoupon.discount_value : '5';

  // 3. Janelas de Tempo
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  let sentCount = 0;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // ==========================================
  // ESTÁGIO 1: Suporte (1 hora após abandono)
  // ==========================================
  const { data: stage1Bookings } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('status', 'pending')
    .eq('remarketing_stage', 0)
    .lt('created_at', oneHourAgo)
    .gt('created_at', twentyFourHoursAgo);

  if (stage1Bookings && stage1Bookings.length > 0) {
    for (const booking of stage1Bookings) {
      if (!booking.customer_email) continue;
      
      const utmLink = `${baseUrl}/checkout?utm_source=remarketing_email&utm_medium=email&utm_campaign=carrinho_abandonado_1`;

      try {
        await transporter.sendMail({
          from: `"Equipe Pratik Turismo" <${settings.smtp_user}>`,
          to: booking.customer_email,
          subject: `${booking.customer_name?.split(' ')[0] || 'Viajante'}, ocorreu tudo bem com sua reserva?`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border-top: 5px solid #0284c7; background-color: #f8fafc; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h2 style="color: #0f172a;">Percebemos que sua reserva ficou pela metade...</h2>
              <p>Olá <strong>${booking.customer_name || ''}</strong>,</p>
              <p>Notamos que você iniciou o processo de reserva para <strong>${booking.product_name}</strong> mas não chegou a concluir.</p>
              <p>Você teve alguma dúvida sobre o roteiro? Aconteceu algum erro no pagamento? Nossa equipe está à disposição para ajudar você a planejar a viagem perfeita para Foz do Iguaçu.</p>
              <br/>
              <div style="text-align: center;">
                 <a href="${utmLink}" style="display: inline-block; background-color: #0284c7; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Retomar Minha Reserva</a>
              </div>
            </div>
          `
        });

        await supabaseAdmin.from('bookings')
          .update({ remarketing_stage: 1, remarketing_sent_at: new Date().toISOString() })
          .eq('id', booking.id);
        sentCount++;
      } catch (e) { console.error(e); }
    }
  }

  // ==========================================
  // ESTÁGIO 2: Desconto Urgente (24h após abandono)
  // ==========================================
  const { data: stage2Bookings } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('status', 'pending')
    .eq('remarketing_stage', 1)
    .lt('created_at', twentyFourHoursAgo)
    .gt('created_at', fortyEightHoursAgo);

  if (stage2Bookings && stage2Bookings.length > 0) {
    for (const booking of stage2Bookings) {
      if (!booking.customer_email) continue;
      
      const utmLink = `${baseUrl}/checkout?utm_source=remarketing_email&utm_medium=email&utm_campaign=carrinho_abandonado_2`;

      try {
        await transporter.sendMail({
          from: `"Pratik Turismo" <${settings.smtp_user}>`,
          to: booking.customer_email,
          subject: `Última chance: ${discountValue}% OFF para você fechar as malas! ✈️`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <div style="background-color: #f97316; padding: 30px; text-align: center; color: white;">
                 <h1 style="margin: 0; font-size: 28px;">As vagas esgotam rápido!</h1>
                 <p style="margin-top: 10px; opacity: 0.9;">Não deixe Foz do Iguaçu para depois.</p>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff;">
                 <p>Oi <strong>${booking.customer_name || 'Viajante'}</strong>,</p>
                 <p>Sua vaga no passeio <strong>${booking.product_name}</strong> ainda está reservada no nosso sistema, mas será liberada em breve.</p>
                 <p>Para te dar aquele empurrãozinho que faltava, liberamos um cupom exclusivo para você usar agora mesmo:</p>
                 
                 <div style="text-align: center; margin: 30px 0;">
                    <span style="background-color: #fff7ed; border: 2px dashed #f97316; color: #ea580c; padding: 15px 30px; font-size: 28px; font-weight: 900; letter-spacing: 3px; border-radius: 12px; display: inline-block;">
                       ${couponCode}
                    </span>
                    <p style="font-size: 13px; color: #666; margin-top: 12px;">Use este código no carrinho para aplicar ${discountValue}% de desconto!</p>
                 </div>
                 
                 <div style="text-align: center;">
                    <a href="${utmLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; text-transform: uppercase;">Finalizar com Desconto</a>
                 </div>
              </div>
            </div>
          `
        });

        await supabaseAdmin.from('bookings')
          .update({ remarketing_stage: 2, remarketing_sent_at: new Date().toISOString() })
          .eq('id', booking.id);
        sentCount++;
      } catch (e) { console.error(e); }
    }
  }

  return NextResponse.json({ success: true, processed_stage1: stage1Bookings?.length || 0, processed_stage2: stage2Bookings?.length || 0, total_sent: sentCount });
}
