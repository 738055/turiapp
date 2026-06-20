// app/api/admin/test-email/route.ts
// Testa a conexão SMTP salvando nas configurações do sistema

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { to } = await request.json();

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'E-mail de destino inválido.' }, { status: 400 });
    }

    // Busca SMTP do banco
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_pass, company_name')
      .single();

    if (settingsError || !settings?.smtp_host) {
      return NextResponse.json(
        { error: 'Configurações SMTP não encontradas. Preencha e salve primeiro.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port) || 587,
      secure: Number(settings.smtp_port) === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
    });

    // Verifica a conexão antes de enviar
    await transporter.verify();

    const companyName = settings.company_name || 'Pratik Turismo';

    await transporter.sendMail({
      from: `"${companyName}" <${settings.smtp_user}>`,
      to,
      subject: `✅ Teste de E-mail — ${companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#0284c7;margin-bottom:8px;">Conexão SMTP funcionando! ✅</h2>
          <p style="color:#374151;">Este é um e-mail de teste enviado pelo painel administrativo da <strong>${companyName}</strong>.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="color:#6b7280;font-size:12px;">Servidor: ${settings.smtp_host}:${settings.smtp_port}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro no teste SMTP:', error);
    return NextResponse.json(
      { error: error.message || 'Falha na conexão SMTP.' },
      { status: 500 }
    );
  }
}
