export interface WhatsAppTemplateDef {
  key: string;
  metaName: string;
  language: string;
  label: string;
  bodyPreview: string;
  paramKeys: string[];
}

// Conteúdo literal das mensagens é fixado pela aprovação do Meta — o que o
// tenant configura por automação é apenas qual template usar e quando disparar.
export const WHATSAPP_TEMPLATES: WhatsAppTemplateDef[] = [
  {
    key: "reserva_confirmada",
    metaName: "reserva_confirmada",
    language: "pt_BR",
    label: "Reserva confirmada",
    bodyPreview:
      "Olá {{1}}! Sua reserva em {{2}} está confirmada ✅\nCódigo: {{3}} | Check-in: {{4}} | Ver detalhes: {{5}}",
    paramKeys: ["customer_name", "product_title", "booking_code", "check_in", "link"],
  },
  {
    key: "lembrete_viagem",
    metaName: "lembrete_viagem",
    language: "pt_BR",
    label: "Lembrete de viagem",
    bodyPreview: "Olá {{1}}! Você viaja em breve para {{2}} 🎒\nQualquer dúvida, estamos aqui!",
    paramKeys: ["customer_name", "product_title"],
  },
  {
    key: "pedido_avaliacao",
    metaName: "pedido_avaliacao",
    language: "pt_BR",
    label: "Pedido de avaliação",
    bodyPreview: "Olá {{1}}! Como foi sua experiência em {{2}}? Responda esta mensagem com seu feedback ⭐",
    paramKeys: ["customer_name", "product_title"],
  },
  {
    key: "reativacao_cliente",
    metaName: "reativacao_cliente",
    language: "pt_BR",
    label: "Reativação de cliente",
    bodyPreview: "Olá {{1}}! Sentimos sua falta 💙 Temos novidades esperando por você.",
    paramKeys: ["customer_name"],
  },
  {
    key: "cotacao_enviada",
    metaName: "cotacao_enviada",
    language: "pt_BR",
    label: "Cotação enviada",
    bodyPreview: "Olá {{1}}! Sua cotação para {{2}} está pronta. Acesse: {{3}}",
    paramKeys: ["customer_name", "product_title", "link"],
  },
];

export function getWhatsAppTemplate(key: string): WhatsAppTemplateDef | undefined {
  return WHATSAPP_TEMPLATES.find((t) => t.key === key);
}
