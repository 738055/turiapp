import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { renderToBuffer } from '@react-pdf/renderer';
import { PassengerAgendaTemplate } from '@/components/PDF/PassengerAgendaTemplate';
import type { PassengerAgendaPDFData } from '@/components/PDF/PassengerAgendaTemplate';
import type { Language } from '@/components/PDF/translations';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdmin();

async function getSmtpTransporter() {
  const { data: settings } = await supabaseAdmin
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

const LANG_LABELS: Record<Language, Record<string, string>> = {
  pt: { docAttached: 'Documento Anexo', greeting: 'Olá', body: 'Segue em anexo o documento referente à', regards: 'Pratik Turismo — Foz do Iguaçu, PR' },
  en: { docAttached: 'Document Attached', greeting: 'Hello', body: 'Please find attached the document for', regards: 'Pratik Turismo — Foz do Iguaçu, PR, Brazil' },
  es: { docAttached: 'Documento Adjunto', greeting: 'Hola', body: 'Adjuntamos el documento referente a', regards: 'Pratik Turismo — Foz do Iguaçu, PR, Brasil' },
};

export async function POST(request: Request) {
  try {
    const referer = request.headers.get('referer') || '';
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    if (appUrl && referer && !referer.startsWith(appUrl)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const lang: Language = ['pt', 'en', 'es'].includes(body.language) ? body.language : 'pt';

    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const { transporter, fromAddress } = await getSmtpTransporter();

    let pdfBuffer: Buffer;
    let filename: string;
    let subject: string;
    let osNumber: string = '';
    let leadPassengerName: string = '';

    // ─── NOVO: PDF gerado client-side (base64) ───────────────────────────────
    if (body.pdfBase64) {
      pdfBuffer = Buffer.from(body.pdfBase64, 'base64');
      filename = body.filename || 'documento.pdf';
      subject = body.subject || `Documento | Pratik Turismo`;
      osNumber = body.osNumber || '';
      leadPassengerName = body.leadPassengerName || '';

    // ─── LEGADO: geração server-side via @react-pdf/renderer (AgendaPax) ─────
    } else if (body.templateType === 'agenda' && body.osData) {
      const osData = body.osData;
      const pdfData: PassengerAgendaPDFData = {
        leadPassengerName: osData.leadPassengerName,
        paxCount: osData.paxCount,
        childrenCount: osData.childrenCount,
        hotelName: osData.hotelName,
        agencyName: osData.agencyName,
        referenceCode: osData.referenceCode,
        dateIn: osData.dateIn,
        dateOut: osData.dateOut,
        osNumber: osData.osNumber,
        guideName: osData.guideName,
        guidePhone: osData.guidePhone,
        observations: osData.notes,
        items: (osData.items || []).map((it: any) => ({
          description: it.description,
          serviceType: it.serviceType,
          date: it.date,
          time: it.time,
          flightNumber: it.flightNumber,
          flightTime: it.flightTime,
          notes: it.notes,
        })),
        companyName: osData.companyName || 'Pratik Turismo / Maia Tours',
        companyPhone: osData.companyPhone,
      };
      pdfBuffer = await renderToBuffer(<PassengerAgendaTemplate data={pdfData} lang={lang} />);
      filename = `Agenda-${osData.leadPassengerName?.replace(/\s/g, '_') || 'Pax'}.pdf`;
      subject = lang === 'en'
        ? `Service Schedule — ${osData.leadPassengerName} | Pratik Turismo`
        : lang === 'es'
          ? `Agenda de Servicios — ${osData.leadPassengerName} | Pratik Turismo`
          : `Agenda de Serviços — ${osData.leadPassengerName} | Pratik Turismo`;
      osNumber = osData.osNumber || '';
      leadPassengerName = osData.leadPassengerName || '';

    } else {
      return NextResponse.json({ error: 'Parâmetros inválidos. Envie pdfBase64 ou templateType=agenda.' }, { status: 400 });
    }

    const labels = LANG_LABELS[lang];

    await transporter.sendMail({
      from: `"Pratik Turismo" <${fromAddress}>`,
      to: body.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2d8c3c;">${labels.docAttached}</h2>
          <p>${labels.greeting},</p>
          <p>${labels.body}${osNumber ? ` <strong>#${osNumber}</strong>` : ''}${leadPassengerName ? ` — <strong>${leadPassengerName}</strong>` : ''}.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">${labels.regards}</p>
        </div>
      `,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
}
