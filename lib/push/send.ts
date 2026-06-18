import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

let configured = false;

/** Configure web-push with VAPID keys once. Returns false if keys are absent —
 *  push is then a no-op (the rest of the app keeps working). */
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contato@turiapp.com.br",
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send a push to every subscription of the given users. Dead endpoints (404/410)
 * are pruned. Best-effort: never throws to the caller.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || userIds.length === 0) return;

  const service = createServiceClient();
  const { data: subs } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subs?.length) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone — remove it so we stop trying.
          await service.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
