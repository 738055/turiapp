import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { VoucherTemplate } from '@/components/PDF/VoucherTemplate';
import type { VoucherData } from '@/components/PDF/VoucherTemplate';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getSmtpTransporter() {
  const { data: settings } = await getSupabaseAdmin()
    .from('system_settings')
    .select('smtp_host, smtp_port, smtp_user, smtp_pass')
    .single();

  if (!settings?.smtp_host) {
    throw new Error('Configurações de SMTP não encontradas no ERP.');
  }

  return {
    transporter: nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: { user: settings.smtp_user, pass: settings.smtp_pass },
    }),
    fromAddress: settings.smtp_user,
  };
}

async function generateQRCode(bookingId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pratikturismo.com.br';
  const validationUrl = `${appUrl}/voucher/validate/${bookingId}`;
  return QRCode.toDataURL(validationUrl, { width: 200, margin: 1 });
}

async function generateVoucherPdf(bookingData: VoucherData): Promise<Buffer> {
  const element = React.createElement(VoucherTemplate, { booking: bookingData });
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Security: validate request origin
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const referer = request.headers.get('referer') || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const isInternalCall = authHeader === `Bearer ${internalKey}`;
    const isSameOrigin = appUrl && referer.startsWith(appUrl);

    if (!isInternalCall && !isSameOrigin) {
      return NextResponse.json({ error: 'Acesso nao autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, email, name, password, bookingId } = body;

    // Validate: at least one action type must be specified
    if (!type && !bookingId) {
      return NextResponse.json({ error: 'Tipo de email ou bookingId obrigatório.' }, { status: 400 });
    }

    if (type === 'welcome' && (!email || typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json({ error: 'Email invalido para welcome.' }, { status: 400 });
    }

    const { transporter, fromAddress } = await getSmtpTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Pratik Turismo" <${fromAddress}>`,
      to: email,
    };

    if (type === 'welcome') {
      // ── E-MAIL DE CRIAÇÃO DE CONTA AUTOMÁTICA ────────────────────────
      mailOptions.subject = 'Sua conta na Pratik Turismo foi criada!';
      mailOptions.html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0284c7;">Olá, ${name}!</h2>
          <p>Notamos que esta é sua primeira compra com a gente. Para facilitar o acesso aos seus vouchers e acompanhamento das reservas, criamos uma conta automática para você!</p>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Seu E-mail (Login):</strong> ${email}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Sua Senha Temporária:</strong> <span style="font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
          </div>

          <p>Você pode acessar sua área do cliente clicando no botão abaixo:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Acessar Minhas Reservas</a>

          <p style="margin-top: 30px; font-size: 12px; color: #666;">Recomendamos que você altere esta senha após o seu primeiro acesso. Aproveite sua viagem!</p>
        </div>
      `;
    } else if (type === 'voucher' || bookingId) {
      // ── E-MAIL DE VOUCHER COM PDF ANEXO ──────────────────────────────
      const targetBookingId = bookingId;

      if (!targetBookingId) {
        throw new Error('bookingId é obrigatório para envio de voucher.');
      }

      // 1. Busca a booking completa
      const { data: booking, error: bookingError } = await getSupabaseAdmin()
        .from('bookings')
        .select('*')
        .eq('id', targetBookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error(`Reserva ${targetBookingId} não encontrada: ${bookingError?.message}`);
      }

      // 2. Busca os itens da booking para obter product_ids
      const { data: bookingItems } = await getSupabaseAdmin()
        .from('booking_items')
        .select('product_id, product_title, quantity, unit_price, date, pickup_location, metadata')
        .eq('booking_id', targetBookingId);

      // 3. Busca important_info dos produtos relacionados
      const productIds = (bookingItems || [])
        .map((bi) => bi.product_id)
        .filter(Boolean);

      let importantInfoMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products } = await getSupabaseAdmin()
          .from('products')
          .select('id, important_info, metadata')
          .in('id', productIds);

        if (products) {
          for (const p of products) {
            const info = p.important_info || p.metadata?.importantInfo || '';
            if (info) importantInfoMap[p.id] = info;
          }
        }
      }

      // 4. Gera QR Code real
      const qrCodeDataUrl = await generateQRCode(targetBookingId);

      // 5. Gera um PDF por item (ou um PDF consolidado se for pedido único)
      const attachments: nodemailer.SendMailOptions['attachments'] = [];
      const recipientEmail = email || booking.customer_email;
      const recipientName = name || booking.customer_name;

      if (bookingItems && bookingItems.length > 0) {
        for (let i = 0; i < bookingItems.length; i++) {
          const item = bookingItems[i];
          const voucherData: VoucherData = {
            id: targetBookingId,
            customerName: booking.customer_name,
            productName: item.product_title || booking.product_name,
            date: item.date || booking.tour_date || booking.date,
            time: item.metadata?.time || undefined,
            quantity: item.quantity || booking.quantity || 1,
            total: (item.unit_price || 0) * (item.quantity || 1),
            pickupLocation: item.pickup_location || undefined,
            importantInfo: item.product_id ? importantInfoMap[item.product_id] : undefined,
            qrCodeDataUrl,
          };

          const pdfBuffer = await generateVoucherPdf(voucherData);
          const suffix = bookingItems.length > 1 ? `-${i + 1}` : '';
          attachments.push({
            filename: `voucher-${targetBookingId.slice(0, 6).toUpperCase()}${suffix}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        }
      } else {
        // Fallback: gera voucher com dados da booking principal
        const voucherData: VoucherData = {
          id: targetBookingId,
          customerName: booking.customer_name,
          productName: booking.product_name,
          date: booking.tour_date || booking.date,
          quantity: booking.quantity || 1,
          total: booking.total,
          importantInfo: productIds[0] ? importantInfoMap[productIds[0]] : undefined,
          qrCodeDataUrl,
        };

        const pdfBuffer = await generateVoucherPdf(voucherData);
        attachments.push({
          filename: `voucher-${targetBookingId.slice(0, 6).toUpperCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      // 6. Monta o email com PDF(s) anexo(s)
      const refCode = targetBookingId.slice(0, 6).toUpperCase();
      mailOptions.to = recipientEmail;
      mailOptions.subject = `Seu Voucher - Pedido #${refCode} | Pratik Turismo`;
      mailOptions.attachments = attachments;
      mailOptions.html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">Voucher Confirmado!</h2>
          <p>Olá <strong>${recipientName}</strong>,</p>
          <p>Seu pagamento foi confirmado e seus vouchers estão anexos neste e-mail.</p>

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 0; font-size: 14px;"><strong>Referência:</strong> #${refCode}</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">PAGO E CONFIRMADO</span></p>
          </div>

          <h3 style="color: #333; margin-top: 25px;">Próximos passos:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Apresente o voucher em PDF (digital ou impresso) no local da atividade.</li>
            <li>Chegue com 15 minutos de antecedência.</li>
            <li>Você também pode acessar seus vouchers em <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://pratikturismo.com.br'}/minhas-reservas" style="color: #0284c7;">Minhas Reservas</a>.</li>
          </ul>

          <p style="margin-top: 30px; font-size: 12px; color: #666;">Em caso de dúvidas, entre em contato com nosso suporte.</p>
          <p style="font-size: 12px; color: #999;">Pratik Turismo — Foz do Iguaçu, PR</p>
        </div>
      `;
    } else {
      throw new Error('Tipo de e-mail inválido. Use "welcome" ou envie um bookingId.');
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
