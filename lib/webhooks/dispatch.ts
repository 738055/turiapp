import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import type { WebhookEventType } from "@/lib/webhooks/events";

type ServiceClient = ReturnType<typeof createServiceClient>;

// Minutes to wait before each retry, indexed by attempt number (1st retry, 2nd, 3rd, 4th).
// After all are exhausted the delivery is marked permanently failed.
const BACKOFF_MINUTES = [1, 5, 30, 120];

interface EndpointRef {
  id: string;
  url: string;
  secret_encrypted: string;
}

interface DeliveryAttempt {
  id: string;
  endpoint: EndpointRef;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
}

/** Fires an event to every active endpoint subscribed to it. Never throws — failures are recorded for retry. */
export async function triggerWebhookEvent(
  tenantId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const service = createServiceClient();

    const { data: endpoints } = await service
      .from("webhook_endpoints")
      .select("id, url, secret_encrypted")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .contains("events", [eventType]);

    if (!endpoints?.length) return;

    for (const endpoint of endpoints) {
      const { data: delivery } = await service
        .from("webhook_deliveries")
        .insert({ endpoint_id: endpoint.id, tenant_id: tenantId, event_type: eventType, payload })
        .select("id")
        .single();

      if (delivery) {
        await attemptDelivery(service, { id: delivery.id, endpoint, eventType, payload, attempts: 0 });
      }
    }
  } catch {
    // Webhook dispatch must never break the caller's main flow
  }
}

/** Re-attempts a specific delivery (used by the cron retry worker and the manual "Reenviar" button). */
export async function retryWebhookDelivery(deliveryId: string): Promise<void> {
  try {
    const service = createServiceClient();

    const { data: delivery } = await service
      .from("webhook_deliveries")
      .select("id, event_type, payload, attempts, webhook_endpoints(id, url, secret_encrypted, active)")
      .eq("id", deliveryId)
      .single();

    if (!delivery) return;
    const endpoint = delivery.webhook_endpoints as unknown as (EndpointRef & { active: boolean }) | null;
    if (!endpoint || !endpoint.active) {
      await service.from("webhook_deliveries").update({ status: "failed" }).eq("id", deliveryId);
      return;
    }

    await attemptDelivery(service, {
      id: delivery.id,
      endpoint,
      eventType: delivery.event_type,
      payload: delivery.payload as Record<string, unknown>,
      attempts: delivery.attempts,
    });
  } catch {
    // ignore — caller already responds based on best-effort
  }
}

export async function attemptDelivery(service: ServiceClient, d: DeliveryAttempt): Promise<void> {
  const body = JSON.stringify({ event: d.eventType, data: d.payload, sent_at: new Date().toISOString() });
  const secret = decrypt(d.endpoint.secret_encrypted);
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  let responseCode: number | null = null;
  let ok = false;

  try {
    const res = await fetch(d.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TuriApp-Signature": signature,
        "X-TuriApp-Event": d.eventType,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    responseCode = res.status;
    ok = res.ok;
  } catch {
    ok = false;
  }

  const attempts = d.attempts + 1;

  if (ok) {
    await service
      .from("webhook_deliveries")
      .update({ status: "success", attempts, response_code: responseCode, last_attempt_at: new Date().toISOString() })
      .eq("id", d.id);
    return;
  }

  const backoffMinutes = BACKOFF_MINUTES[attempts - 1];
  if (backoffMinutes === undefined) {
    await service
      .from("webhook_deliveries")
      .update({ status: "failed", attempts, response_code: responseCode, last_attempt_at: new Date().toISOString() })
      .eq("id", d.id);
    return;
  }

  await service
    .from("webhook_deliveries")
    .update({
      status: "pending",
      attempts,
      response_code: responseCode,
      last_attempt_at: new Date().toISOString(),
      next_attempt_at: new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString(),
    })
    .eq("id", d.id);
}
