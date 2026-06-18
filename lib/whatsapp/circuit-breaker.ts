import type { createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

type Service = ReturnType<typeof createServiceClient>;

// If a tenant's WhatsApp account is compromised (or an automation misfires), an
// abnormal burst of sends can get the tenant's number banned by Meta. This is a
// DB-backed circuit breaker (counts rows in whatsapp_logs) so it works across
// serverless instances — unlike the in-memory rate limiter. Above the threshold
// we stop sending and alert the super admin via the audit trail.
export const WHATSAPP_HOURLY_LIMIT = 200;

export interface CircuitState {
  allowed: boolean;
  count: number;
  limit: number;
}

export async function checkWhatsAppCircuit(service: Service, tenantId: string): Promise<CircuitState> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from("whatsapp_logs")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "sent")
    .gte("sent_at", since);

  const used = count ?? 0;
  return { allowed: used < WHATSAPP_HOURLY_LIMIT, count: used, limit: WHATSAPP_HOURLY_LIMIT };
}

let lastTripAlertAt = 0;

/** Records the trip (audit log = super-admin-visible alert) and a failed log row.
 *  Alerting is throttled to once per 10 min per process to avoid log spam. */
export async function tripWhatsAppCircuit(service: Service, tenantId: string, count: number): Promise<void> {
  await service.from("whatsapp_logs").insert({
    tenant_id: tenantId,
    phone: "—",
    template: "circuit_breaker",
    status: "failed",
    error: `Circuit breaker: ${count} envios na última hora (limite ${WHATSAPP_HOURLY_LIMIT}). Envios pausados.`,
  });

  const now = Date.now();
  if (now - lastTripAlertAt > 10 * 60 * 1000) {
    lastTripAlertAt = now;
    await writeAuditLog({
      tenant_id: tenantId,
      action: "whatsapp.circuit_tripped",
      resource: "whatsapp_logs",
      metadata: { count, limit: WHATSAPP_HOURLY_LIMIT },
    });
  }
}
