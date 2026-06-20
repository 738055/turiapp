'use client';

import { VoucherFull, Company } from '@/types';

// ─── i18n labels ─────────────────────────────────────────────────────────────
const LABELS = {
  pt: {
    voucherTitle: 'VOUCHER DE SERVIÇOS',
    issuedOn: 'Emitido em',
    tourismIn: 'Turismo em',
    agency: 'Agência',
    holder: 'Titular da Reserva',
    serviceDate: 'Data do Serviço',
    hotel: 'Hotel / Local de Saída',
    departure: 'Saída',
    service: 'Serviço',
    type: 'Tipo',
    paxType: 'Tipo PAX',
    qty: 'Qtd',
    pricePerPax: 'Valor/PAX',
    subtotal: 'Subtotal',
    totalServices: 'Total dos Serviços',
    amountPaid: 'Valor Pago',
    remaining: 'Saldo Restante',
    notes: 'Obs:',
    copy1: '1ª VIA — AGÊNCIA',
    copy2: '2ª VIA — PASSAGEIRO',
    cutHere: '✂ RECORTE AQUI',
    status: { active: 'ATIVO', used: 'UTILIZADO', cancelled: 'CANCELADO' },
  },
  en: {
    voucherTitle: 'SERVICE VOUCHER',
    issuedOn: 'Issued on',
    tourismIn: 'Tours in',
    agency: 'Agency',
    holder: 'Reservation Holder',
    serviceDate: 'Service Date',
    hotel: 'Hotel / Pickup Location',
    departure: 'Departure',
    service: 'Service',
    type: 'Type',
    paxType: 'PAX Type',
    qty: 'Qty',
    pricePerPax: 'Price/PAX',
    subtotal: 'Subtotal',
    totalServices: 'Total Services',
    amountPaid: 'Amount Paid',
    remaining: 'Remaining Balance',
    notes: 'Notes:',
    copy1: 'COPY 1 — AGENCY',
    copy2: 'COPY 2 — PASSENGER',
    cutHere: '✂ CUT HERE',
    status: { active: 'ACTIVE', used: 'USED', cancelled: 'CANCELLED' },
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string | undefined, lang: 'pt' | 'en'): string => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return lang === 'en' ? `${m}/${day}/${y}` : `${day}/${m}/${y}`;
};

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateVoucherHTML(voucher: VoucherFull, company?: Company): string {
  const lang = company?.language ?? voucher.companyLanguage ?? 'pt';
  const L = LABELS[lang] || LABELS.pt;

  const color = company?.primaryColor || '#0A6640';
  const companyName = company?.name || voucher.companyName || 'A10 Receptivo';
  const companyPhone = company?.phone || '(45) 99108-3852';
  const companyEmail = company?.email || '';
  const companyCnpj = company?.cnpj || '';
  const companyCity = company?.city || 'Foz do Iguaçu';
  const companyState = company?.state || 'PR';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = company?.logoUrl
    ? (company.logoUrl.startsWith('http') ? company.logoUrl : origin + company.logoUrl)
    : origin + '/logo.png';

  const issueDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const statusColor: Record<string, string> = {
    active: color,
    used: '#555',
    cancelled: '#c00',
  };

  // ─── Subtítulo da empresa ──────────────────────────────────────────────────
  const companySubtitle = lang === 'en'
    ? `${L.tourismIn} Foz do Iguaçu · ${companyPhone}`
    : `${L.tourismIn} Foz do Iguaçu · ${companyPhone}`;

  // ─── Rodapé da empresa ─────────────────────────────────────────────────────
  const companyFooter = [
    companyName,
    `${companyCity} - ${companyState}`,
    companyCnpj ? (lang === 'en' ? `Tax ID: ${companyCnpj}` : `CNPJ: ${companyCnpj}`) : null,
  ].filter(Boolean).join(' · ');

  // ─── Tabela de itens ───────────────────────────────────────────────────────
  const itemsHTML = voucher.items.map(item =>
    item.pax.map(p => `
      <tr>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0;">${item.serviceName}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0; color:#555;">${item.serviceType}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0; text-align:center;">${p.paxType}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0; text-align:center; font-weight:600;">${p.quantity}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0; text-align:right;">${fmt(p.pricePerPax)}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #f0f0f0; text-align:right; font-weight:700;">${fmt(p.quantity * p.pricePerPax)}</td>
      </tr>
    `).join('')
  ).join('');

  // ─── Bloco de voucher (reutilizado 2x) ────────────────────────────────────
  const voucherBlock = (copyLabel: string) => `
    <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#222; padding:12mm 10mm; border:2px solid ${color}; border-radius:6px;">

      <!-- CABEÇALHO -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="width:110px; vertical-align:middle;">
            <img src="${logoUrl}" alt="${companyName}"
              style="max-width:100px; max-height:50px; object-fit:contain;"
              onerror="this.style.display='none'" />
          </td>
          <td style="vertical-align:middle; text-align:center; padding:0 8px;">
            <div style="font-size:17px; font-weight:800; color:${color}; letter-spacing:1px;">${companyName.toUpperCase()}</div>
            <div style="font-size:10px; color:#555; margin-top:2px;">${companySubtitle}</div>
            ${companyEmail ? `<div style="font-size:10px; color:#555;">${companyEmail}</div>` : ''}
          </td>
          <td style="width:135px; vertical-align:middle; text-align:right;">
            <div style="background:${color}; color:#fff; padding:5px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px; display:inline-block;">
              ${L.voucherTitle}
            </div>
            <div style="margin-top:5px; font-size:11px; font-weight:800; color:${color}; font-family:monospace;">${voucher.voucherNumber}</div>
            <div style="font-size:9px; color:#888; margin-top:2px;">${L.issuedOn} ${issueDate}</div>
            <div style="margin-top:4px;">
              <span style="background:${statusColor[voucher.status]}; color:#fff; padding:2px 7px; border-radius:10px; font-size:9px; font-weight:700;">
                ${L.status[voucher.status as keyof typeof L.status] || voucher.status.toUpperCase()}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <!-- LINHA DOURADA -->
      <div style="border-top:2px solid #D4AF37; margin:8px 0;"></div>

      <!-- DADOS DA RESERVA -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr style="background:#f9fafb;">
          <td style="padding:6px 8px; width:26%;">
            <div style="font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${L.agency}</div>
            <div style="font-weight:700; color:${color}; font-size:12px;">${voucher.agencyName}</div>
          </td>
          <td style="padding:6px 8px; width:30%;">
            <div style="font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${L.holder}</div>
            <div style="font-weight:700; font-size:12px;">${voucher.holderName}</div>
          </td>
          <td style="padding:6px 8px; width:16%; text-align:center;">
            <div style="font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${L.serviceDate}</div>
            <div style="font-weight:700; font-size:12px;">${fmtDate(voucher.serviceDate, lang)}</div>
          </td>
          <td style="padding:6px 8px; width:20%;">
            <div style="font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${L.hotel}</div>
            <div style="font-weight:600; font-size:11px;">${voucher.hotel || '—'}</div>
          </td>
          <td style="padding:6px 8px; width:8%; text-align:center;">
            <div style="font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${L.departure}</div>
            <div style="font-weight:600; font-size:12px;">${voucher.pickupTime || '—'}</div>
          </td>
        </tr>
      </table>

      <!-- TABELA DE SERVIÇOS -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <thead>
          <tr style="background:${color}; color:#fff;">
            <th style="padding:7px 8px; text-align:left; font-size:10px; font-weight:700;">${L.service}</th>
            <th style="padding:7px 8px; text-align:left; font-size:10px; font-weight:700;">${L.type}</th>
            <th style="padding:7px 8px; text-align:center; font-size:10px; font-weight:700;">${L.paxType}</th>
            <th style="padding:7px 8px; text-align:center; font-size:10px; font-weight:700;">${L.qty}</th>
            <th style="padding:7px 8px; text-align:right; font-size:10px; font-weight:700;">${L.pricePerPax}</th>
            <th style="padding:7px 8px; text-align:right; font-size:10px; font-weight:700;">${L.subtotal}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- RESUMO FINANCEIRO -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="width:58%; vertical-align:top; padding-right:12px;">
            ${voucher.notes
              ? `<div style="font-size:10px; color:#555; background:#f9fafb; padding:6px 8px; border-radius:4px; border-left:3px solid ${color};">
                   <b>${L.notes}</b> ${voucher.notes}
                 </div>`
              : ''}
          </td>
          <td style="width:42%;">
            <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden;">
              <tr style="background:#f9fafb;">
                <td style="padding:5px 10px; font-size:11px; color:#555;">${L.totalServices}</td>
                <td style="padding:5px 10px; font-size:11px; font-weight:700; text-align:right;">${fmt(voucher.totalAmount)}</td>
              </tr>
              <tr>
                <td style="padding:5px 10px; font-size:11px; color:#555;">${L.amountPaid}</td>
                <td style="padding:5px 10px; font-size:11px; font-weight:700; text-align:right; color:${color};">${fmt(voucher.amountPaid)}</td>
              </tr>
              <tr style="background:${voucher.remainingBalance > 0 ? '#fff7ed' : '#f0fdf4'};">
                <td style="padding:6px 10px; font-size:12px; font-weight:700; color:${voucher.remainingBalance > 0 ? '#c05c00' : color};">${L.remaining}</td>
                <td style="padding:6px 10px; font-size:14px; font-weight:800; text-align:right; color:${voucher.remainingBalance > 0 ? '#c05c00' : color};">${fmt(voucher.remainingBalance)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- RODAPÉ -->
      <div style="border-top:1px solid #e5e7eb; padding-top:6px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:9px; color:#aaa;">${companyFooter}</div>
        <div style="font-size:9px; color:#aaa; font-weight:700; border:1px solid #ddd; padding:2px 8px; border-radius:3px; white-space:nowrap;">
          ${copyLabel}
        </div>
      </div>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${L.voucherTitle} ${voucher.voucherNumber} — ${companyName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; }
    @page { size: A4 portrait; margin: 8mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .separator {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 5mm 0;
      color: #bbb;
      font-size: 10px;
      font-family: Arial, sans-serif;
    }
    .separator::before, .separator::after {
      content: '';
      flex: 1;
      border-top: 1px dashed #ccc;
    }
    .voucher-copy { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="voucher-copy">
    ${voucherBlock(L.copy1)}
  </div>

  <div class="separator">${L.cutHere}</div>

  <div class="voucher-copy">
    ${voucherBlock(L.copy2)}
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;
}
