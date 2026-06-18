import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set.");
    _resend = new Resend(key);
  }
  return _resend;
}

const PLATFORM_DOMAIN = process.env.PLATFORM_EMAIL_DOMAIN ?? "turiapp.com.br";

export interface SendEmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailOptions {
  tenantSlug: string;
  tenantName: string;
  tenantReplyTo?: string;
  to: string;
  subject: string;
  html: string;
  attachments?: SendEmailAttachment[];
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const resend = getResend();
  const from = `${opts.tenantName} <noreply.${opts.tenantSlug}@${PLATFORM_DOMAIN}>`;

  await resend.emails.send({
    from,
    to: opts.to,
    replyTo: opts.tenantReplyTo,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
}

/** Platform-originated email (billing/dunning), sent from the TuriApp account
 *  rather than on behalf of a tenant. */
export async function sendPlatformEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: `TuriApp <noreply@${PLATFORM_DOMAIN}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export interface DunningEmailData {
  tenantName: string;
  attempt: number;
  manageUrl: string;
  finalWarning?: boolean;
}

export function renderDunningEmailHtml(data: DunningEmailData): string {
  const color = "#0ea5e9";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Pagamento da assinatura</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${data.finalWarning ? "#dc2626" : color};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:19px;">${data.finalWarning ? "Último aviso — assinatura em risco" : "Não conseguimos processar seu pagamento"}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Olá, ${data.tenantName}!</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              ${data.finalWarning
                ? "Esta é a última tentativa de cobrança da sua assinatura TuriApp. Se o pagamento não for regularizado, sua loja será suspensa e ficará indisponível para seus clientes."
                : `Tentamos cobrar sua assinatura TuriApp, mas a tentativa falhou (tentativa ${data.attempt}). Sua loja continua ativa por enquanto — atualize seus dados de pagamento para evitar a suspensão.`}
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.manageUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Atualizar pagamento →
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;">Se você já regularizou, pode ignorar este e-mail.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">TuriApp — cobrança automática</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface VoucherData {
  bookingId: string;
  productTitle: string;
  customerName: string;
  checkinDate?: string | null;
  checkoutDate?: string | null;
  guests: number;
  totalPrice: number;
  currency: string;
  tenantName: string;
  tenantLogoUrl?: string | null;
  primaryColor?: string;
}

export interface BookingNotificationData {
  bookingId: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  checkinDate?: string | null;
  checkoutDate?: string | null;
  guests: number;
  totalPrice: number;
  currency: string;
  tenantName: string;
  primaryColor?: string;
  adminUrl: string;
}

export function renderBookingNotificationHtml(data: BookingNotificationData): string {
  const color = data.primaryColor ?? "#0ea5e9";
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const formatMoney = (v: number, c: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Nova Reserva</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:24px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">NOVA RESERVA RECEBIDA</p>
            <h1 style="margin:4px 0 0;color:#fff;font-size:20px;">${data.productTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:20px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;width:130px;">Código</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;">${data.bookingId.slice(0, 8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">Cliente</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${data.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">E-mail</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${data.customerEmail}</td>
                  </tr>
                  ${data.customerPhone ? `<tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">Telefone</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${data.customerPhone}</td>
                  </tr>` : ""}
                  ${data.checkinDate ? `<tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">Check-in</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${formatDate(data.checkinDate)}</td>
                  </tr>` : ""}
                  ${data.checkoutDate ? `<tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">Check-out</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${formatDate(data.checkoutDate)}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:13px;">Pessoas</td>
                    <td style="padding:5px 0;color:#111827;font-size:13px;">${data.guests}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 5px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;">Total</td>
                    <td style="padding:8px 0 5px;color:${color};font-size:16px;font-weight:700;border-top:1px solid #e5e7eb;">${formatMoney(data.totalPrice, data.currency)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <div style="text-align:center;">
              <a href="${data.adminUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Ver reserva no painel →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">TuriApp — notificação automática para ${data.tenantName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface QuoteEmailData {
  customerName: string;
  productTitle: string;
  checkinDate?: string | null;
  checkoutDate?: string | null;
  guests: number;
  totalPrice: number;
  currency: string;
  tenantName: string;
  primaryColor?: string;
  quoteUrl: string;
  expiresAt: string;
}

export function renderQuoteEmailHtml(data: QuoteEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const formatMoney = (v: number, c: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);
  const expires = new Date(data.expiresAt).toLocaleString("pt-BR");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Sua cotação</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;">${data.tenantName}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Sua cotação personalizada chegou!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#111827;">Olá, <strong>${data.customerName}</strong>!</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:20px;">
              <tr><td style="padding:20px 24px;">
                <h2 style="margin:0 0 14px;font-size:18px;color:#111827;">${data.productTitle}</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${data.checkinDate ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:130px;">Check-in</td><td style="padding:5px 0;color:#111827;font-size:13px;">${formatDate(data.checkinDate)}</td></tr>` : ""}
                  ${data.checkoutDate ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Check-out</td><td style="padding:5px 0;color:#111827;font-size:13px;">${formatDate(data.checkoutDate)}</td></tr>` : ""}
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Pessoas</td><td style="padding:5px 0;color:#111827;font-size:13px;">${data.guests}</td></tr>
                  <tr><td style="padding:8px 0 5px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;">Total</td><td style="padding:8px 0 5px;color:${color};font-size:16px;font-weight:700;border-top:1px solid #e5e7eb;">${formatMoney(data.totalPrice, data.currency)}</td></tr>
                </table>
              </td></tr>
            </table>
            <div style="text-align:center;margin-bottom:16px;">
              <a href="${data.quoteUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Ver cotação e reservar →
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Esta proposta expira em ${expires}.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface AutomationEmailData {
  heading: string;
  body: string;
  tenantName: string;
  primaryColor?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function renderAutomationEmailHtml(data: AutomationEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>${data.heading}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">${data.tenantName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${data.heading}</h2>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;white-space:pre-line;">${data.body}</p>
            ${data.ctaUrl && data.ctaLabel ? `<div style="text-align:center;">
              <a href="${data.ctaUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                ${data.ctaLabel} →
              </a>
            </div>` : ""}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Mensagem automática de ${data.tenantName} via TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface MonthlyReportEmailData {
  tenantName: string;
  monthLabel: string;
  revenue: number;
  currency: string;
  bookingsCount: number;
  newCustomers: number;
  primaryColor?: string;
}

export function renderMonthlyReportEmailHtml(data: MonthlyReportEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";
  const formatMoney = (v: number, c: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Relatório mensal</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">${data.tenantName}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Relatório mensal — ${data.monthLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">O relatório em PDF de ${data.monthLabel} está em anexo. Resumo rápido:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:16px 24px;color:#6b7280;font-size:13px;">Receita do mês</td>
                <td style="padding:16px 24px;color:${color};font-size:15px;font-weight:700;text-align:right;">${formatMoney(data.revenue, data.currency)}</td>
              </tr>
              <tr>
                <td style="padding:0 24px 16px;color:#6b7280;font-size:13px;">Reservas confirmadas</td>
                <td style="padding:0 24px 16px;color:#111827;font-size:15px;font-weight:700;text-align:right;">${data.bookingsCount}</td>
              </tr>
              <tr>
                <td style="padding:0 24px 16px;color:#6b7280;font-size:13px;">Novos clientes</td>
                <td style="padding:0 24px 16px;color:#111827;font-size:15px;font-weight:700;text-align:right;">${data.newCustomers}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface LoyaltyCodeEmailData {
  code: string;
  tenantName: string;
  primaryColor?: string;
}

export function renderLoyaltyCodeEmailHtml(data: LoyaltyCodeEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Seu código de acesso</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:18px;">${data.tenantName}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Programa de fidelidade</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Use o código abaixo para acessar sua conta de fidelidade:</p>
            <p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:6px;color:${color};">${data.code}</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">Este código expira em 10 minutos. Se você não solicitou, ignore este e-mail.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface LoyaltyEarnedEmailData {
  customerName: string;
  points: number;
  tenantName: string;
  primaryColor?: string;
}

export function renderLoyaltyEarnedEmailHtml(data: LoyaltyEarnedEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Você ganhou pontos!</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">${data.tenantName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Parabéns, <strong>${data.customerName}</strong>!</p>
            <p style="margin:0 0 16px;font-size:30px;font-weight:700;color:${color};">+${data.points} pontos</p>
            <p style="margin:0;font-size:14px;color:#6b7280;">Os pontos já estão disponíveis na sua conta de fidelidade e podem ser usados como desconto na próxima reserva.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface ReviewRequestEmailData {
  customerName: string;
  productTitle: string;
  tenantName: string;
  reviewUrl: string;
  primaryColor?: string;
}

export function renderReviewRequestEmailHtml(data: ReviewRequestEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Como foi sua experiência?</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">${data.tenantName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Olá, <strong>${data.customerName}</strong>!</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">
              Esperamos que tenha aproveitado <strong>${data.productTitle}</strong>. Sua opinião ajuda muito —
              leva menos de um minuto.
            </p>
            <div style="font-size:28px;letter-spacing:4px;margin-bottom:20px;">⭐️⭐️⭐️⭐️⭐️</div>
            <a href="${data.reviewUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Avaliar minha experiência →
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface InviteEmailData {
  tenantName: string;
  roleLabel: string;
  inviterName?: string | null;
  acceptUrl: string;
  expiresAt: string;
  primaryColor?: string;
}

export function renderInviteEmailHtml(data: InviteEmailData): string {
  const color = data.primaryColor ?? "#0ea5e9";
  const expires = new Date(data.expiresAt).toLocaleString("pt-BR");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Convite para a equipe</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">${data.tenantName}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Convite para a equipe</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              ${data.inviterName ? `<strong>${data.inviterName}</strong> convidou` : "Você foi convidado"} você para participar da equipe de <strong>${data.tenantName}</strong> no painel TuriApp, com o perfil de <strong>${data.roleLabel}</strong>.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.acceptUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Aceitar convite →
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Este convite expira em ${expires}. Se você não esperava este e-mail, pode ignorá-lo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Powered by TuriApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderVoucherHtml(data: VoucherData): string {
  const color = data.primaryColor ?? "#0ea5e9";
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const formatMoney = (v: number, c: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voucher de Reserva</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${color};padding:28px 32px;text-align:center;">
              ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" height="48" style="display:block;margin:0 auto 12px;" />` : ""}
              <h1 style="margin:0;color:#ffffff;font-size:22px;">${data.tenantName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Voucher de Reserva</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#111827;">
                Olá, <strong>${data.customerName}</strong>!<br />
                Sua reserva foi confirmada. Guarde este voucher.
              </p>
              <!-- Booking box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${data.productTitle}</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">Código da reserva</td>
                        <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${data.bookingId.slice(0, 8).toUpperCase()}</td>
                      </tr>
                      ${data.checkinDate ? `
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Check-in</td>
                        <td style="padding:6px 0;color:#111827;font-size:14px;">${formatDate(data.checkinDate)}</td>
                      </tr>` : ""}
                      ${data.checkoutDate ? `
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Check-out</td>
                        <td style="padding:6px 0;color:#111827;font-size:14px;">${formatDate(data.checkoutDate)}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Hóspedes / Pessoas</td>
                        <td style="padding:6px 0;color:#111827;font-size:14px;">${data.guests}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Total</td>
                        <td style="padding:6px 0;color:${color};font-size:16px;font-weight:700;">${formatMoney(data.totalPrice, data.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Em caso de dúvidas, entre em contato com ${data.tenantName}.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#d1d5db;">
                Powered by TuriApp — plataforma para negócios de turismo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
