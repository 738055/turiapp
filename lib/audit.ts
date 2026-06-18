import { createServiceClient } from "@/lib/supabase/server";

export interface AuditEvent {
  tenant_id?: string | null;
  user_id?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
}

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("audit_logs").insert({
      tenant_id: event.tenant_id ?? null,
      user_id: event.user_id ?? null,
      action: event.action,
      resource: event.resource,
      resource_id: event.resource_id ?? null,
      metadata: event.metadata ?? {},
      ip_address: event.ip_address ?? null,
    });
  } catch {
    // Audit log failure must never break the main flow
  }
}

export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
