export const WEBHOOK_EVENT_TYPES = [
  "customer.created",
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
  "booking.completed",
  "lead.created",
  "quote.accepted",
  "review.submitted",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WEBHOOK_EVENT_LABEL: Record<WebhookEventType, string> = {
  "customer.created": "Cliente cadastrado",
  "booking.created": "Reserva criada",
  "booking.confirmed": "Reserva confirmada",
  "booking.cancelled": "Reserva cancelada",
  "booking.completed": "Reserva concluída",
  "lead.created": "Lead recebido",
  "quote.accepted": "Cotação aceita",
  "review.submitted": "Avaliação enviada",
};
