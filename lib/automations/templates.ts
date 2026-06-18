import type { TriggerType, ActionType, AutomationEntityType } from "@/types";

export const TRIGGER_LABEL: Record<TriggerType, string> = {
  booking_confirmed: "Reserva confirmada",
  checkin_in_days: "Check-in em X dias",
  checkout_days_ago: "Check-out concluído há X dias",
  customer_inactive_days: "Cliente não reserva há X dias",
  lead_no_response_days: "Lead sem resposta há X dias",
  quote_expiring_soon: "Cotação prestes a expirar",
};

export const ACTION_LABEL: Record<ActionType, string> = {
  send_email: "Enviar e-mail",
  send_whatsapp: "Enviar WhatsApp",
  internal_notification: "Criar notificação interna",
  move_lead_status: "Mover lead no pipeline",
};

export const TRIGGER_ENTITY: Record<TriggerType, AutomationEntityType> = {
  booking_confirmed: "booking",
  checkin_in_days: "booking",
  checkout_days_ago: "booking",
  customer_inactive_days: "customer",
  lead_no_response_days: "lead",
  quote_expiring_soon: "quote",
};

// Quais gatilhos pedem um campo numérico extra no formulário (dias ou horas)
export const TRIGGER_NUMBER_FIELD: Record<TriggerType, { key: "days" | "hours"; label: string } | null> = {
  booking_confirmed: null,
  checkin_in_days: { key: "days", label: "Dias antes do check-in" },
  checkout_days_ago: { key: "days", label: "Dias após o check-out" },
  customer_inactive_days: { key: "days", label: "Dias sem reservar" },
  lead_no_response_days: { key: "days", label: "Dias sem resposta" },
  quote_expiring_soon: { key: "hours", label: "Horas antes de expirar" },
};

export interface EmailActionConfig {
  subject: string;
  heading: string;
  body: string;
  cta_label?: string;
  cta_url?: string;
}

export interface NotificationActionConfig {
  title: string;
  message: string;
}

export interface MoveLeadActionConfig {
  next_status: "novo" | "cotacao_enviada" | "negociando" | "reservado" | "perdido";
}

export interface WhatsAppActionConfig {
  template_key: string;
}

export interface AutomationPreset {
  key: string;
  name: string;
  description: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  delay_hours: number;
}

export const AUTOMATION_PRESETS: AutomationPreset[] = [
  {
    key: "boas-vindas",
    name: "Boas-vindas",
    description: "Email personalizado quando uma reserva é confirmada.",
    trigger_type: "booking_confirmed",
    trigger_config: {},
    action_type: "send_email",
    action_config: {
      subject: "Sua reserva está confirmada!",
      heading: "Tudo certo, {{customer_name}}!",
      body: "Sua reserva em {{product_title}} foi confirmada. Estamos muito felizes em receber você em breve! Se tiver qualquer dúvida, é só responder este e-mail.",
    },
    delay_hours: 0,
  },
  {
    key: "lembrete-viagem",
    name: "Lembrete de viagem",
    description: "Email de aviso 7 dias antes do check-in.",
    trigger_type: "checkin_in_days",
    trigger_config: { days: 7 },
    action_type: "send_email",
    action_config: {
      subject: "Você viaja em breve!",
      heading: "Faltam poucos dias, {{customer_name}}!",
      body: "Sua estadia em {{product_title}} começa em {{check_in}}. Aproveite para organizar tudo com antecedência.",
    },
    delay_hours: 0,
  },
  {
    key: "pos-viagem",
    name: "Pós-viagem",
    description: "Email pedindo feedback 1 dia após o check-out.",
    trigger_type: "checkout_days_ago",
    trigger_config: { days: 1 },
    action_type: "send_email",
    action_config: {
      subject: "Como foi sua experiência?",
      heading: "Esperamos que tenha sido ótimo, {{customer_name}}!",
      body: "Sua estadia em {{product_title}} terminou recentemente. Adoraríamos saber como foi — responda este e-mail com seu feedback.",
    },
    delay_hours: 24,
  },
  {
    key: "reativacao",
    name: "Reativação",
    description: "Email com oferta para clientes sem reservas há 90 dias.",
    trigger_type: "customer_inactive_days",
    trigger_config: { days: 90 },
    action_type: "send_email",
    action_config: {
      subject: "Sentimos sua falta!",
      heading: "Que tal voltar a viajar, {{customer_name}}?",
      body: "Já faz um tempo desde sua última reserva. Temos novidades esperando por você — dá uma olhada no que preparamos.",
    },
    delay_hours: 0,
  },
  {
    key: "lead-frio",
    name: "Lead frio",
    description: "Notifica a equipe quando um lead fica sem resposta por 3 dias.",
    trigger_type: "lead_no_response_days",
    trigger_config: { days: 3 },
    action_type: "internal_notification",
    action_config: {
      title: "Lead sem resposta",
      message: "{{customer_name}} entrou em contato e ainda não recebeu retorno há {{days}} dias.",
    },
    delay_hours: 0,
  },
  {
    key: "cotacao-expirando",
    name: "Cotação expirando",
    description: "Lembra o lead 24h antes da cotação expirar.",
    trigger_type: "quote_expiring_soon",
    trigger_config: { hours: 24 },
    action_type: "send_email",
    action_config: {
      subject: "Sua cotação expira em breve",
      heading: "Não perca essa oportunidade, {{customer_name}}!",
      body: "Sua cotação para {{product_title}} expira em breve. Acesse o link abaixo para garantir sua reserva.",
      cta_label: "Ver cotação",
      cta_url: "{{quote_url}}",
    },
    delay_hours: 0,
  },
];
