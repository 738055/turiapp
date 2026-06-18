export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, renderAutomationEmailHtml } from "@/lib/email/resend";
import { renderTemplate, addDaysIsoDate } from "@/lib/automations/render";
import { TRIGGER_ENTITY } from "@/lib/automations/templates";
import type {
  EmailActionConfig,
  NotificationActionConfig,
  MoveLeadActionConfig,
  WhatsAppActionConfig,
} from "@/lib/automations/templates";
import { decrypt } from "@/lib/crypto";
import { sendWhatsAppTemplate, normalizePhone } from "@/lib/whatsapp/360dialog";
import { getWhatsAppTemplate } from "@/lib/whatsapp/templates";
import { checkWhatsAppCircuit, tripWhatsAppCircuit } from "@/lib/whatsapp/circuit-breaker";
import { writeAuditLog } from "@/lib/audit";
import type { Automation, AutomationEntityType } from "@/types";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no servidor." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: automations } = await service
    .from("automations")
    .select("*")
    .eq("active", true);

  let discovered = 0;
  for (const automation of (automations ?? []) as Automation[]) {
    discovered += await discoverRuns(service, automation);
  }

  const { data: dueRuns } = await service
    .from("automation_runs")
    .select("*, automations(*)")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(200);

  let executed = 0;
  let failed = 0;
  let skipped = 0;

  for (const run of dueRuns ?? []) {
    const result = await executeRun(service, run);
    if (result === "executed") executed++;
    else if (result === "failed") failed++;
    else skipped++;
  }

  await writeAuditLog({
    action: "automations.cron_run",
    resource: "automation_runs",
    metadata: { automations: automations?.length ?? 0, discovered, executed, failed, skipped },
  });

  return NextResponse.json({ automations: automations?.length ?? 0, discovered, executed, failed, skipped });
}

async function discoverRuns(service: ServiceClient, automation: Automation): Promise<number> {
  const entityIds = await findMatchingEntities(service, automation);
  if (!entityIds.length) return 0;

  const entityType = TRIGGER_ENTITY[automation.trigger_type];
  const scheduledAt = new Date(Date.now() + automation.delay_hours * 60 * 60 * 1000).toISOString();

  const rows = entityIds.map((entity_id) => ({
    automation_id: automation.id,
    tenant_id: automation.tenant_id,
    entity_type: entityType,
    entity_id,
    scheduled_at: scheduledAt,
    status: "pending" as const,
  }));

  const { error } = await service
    .from("automation_runs")
    .upsert(rows, { onConflict: "automation_id,entity_type,entity_id", ignoreDuplicates: true });

  return error ? 0 : rows.length;
}

async function findMatchingEntities(service: ServiceClient, automation: Automation): Promise<string[]> {
  const tenantId = automation.tenant_id;
  const cfg = automation.trigger_config;

  switch (automation.trigger_type) {
    case "booking_confirmed": {
      const { data } = await service.from("bookings").select("id").eq("tenant_id", tenantId).eq("status", "confirmed");
      return (data ?? []).map((r) => r.id);
    }
    case "checkin_in_days": {
      const days = Number(cfg.days ?? 7);
      const targetDate = addDaysIsoDate(new Date(), days);
      const { data } = await service
        .from("bookings")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "confirmed")
        .eq("check_in", targetDate);
      return (data ?? []).map((r) => r.id);
    }
    case "checkout_days_ago": {
      const days = Number(cfg.days ?? 1);
      const targetDate = addDaysIsoDate(new Date(), -days);
      const { data } = await service
        .from("bookings")
        .select("id")
        .eq("tenant_id", tenantId)
        .in("status", ["confirmed", "completed"])
        .eq("check_out", targetDate);
      return (data ?? []).map((r) => r.id);
    }
    case "customer_inactive_days": {
      const days = Number(cfg.days ?? 90);
      return findInactiveCustomerIds(service, tenantId, days);
    }
    case "lead_no_response_days": {
      const days = Number(cfg.days ?? 3);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await service
        .from("leads")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "novo")
        .lte("created_at", cutoff);
      return (data ?? []).map((r) => r.id);
    }
    case "quote_expiring_soon": {
      const hours = Number(cfg.hours ?? 24);
      const now = new Date();
      const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
      const { data } = await service
        .from("quotes")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .gt("expires_at", now.toISOString())
        .lte("expires_at", windowEnd);
      return (data ?? []).map((r) => r.id);
    }
    default:
      return [];
  }
}

async function findInactiveCustomerIds(service: ServiceClient, tenantId: string, days: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await service
    .from("bookings")
    .select("customer_id, created_at, status")
    .eq("tenant_id", tenantId)
    .not("customer_id", "is", null);

  const lastByCustomer = new Map<string, string>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled" || b.status === "refunded" || !b.customer_id) continue;
    const prev = lastByCustomer.get(b.customer_id);
    if (!prev || b.created_at > prev) lastByCustomer.set(b.customer_id, b.created_at);
  }

  return Array.from(lastByCustomer.entries())
    .filter(([, lastDate]) => lastDate <= cutoff)
    .map(([customerId]) => customerId);
}

interface RunVars {
  email: string | null;
  phone: string | null;
  link?: string;
  fields: Record<string, string>;
}

async function buildVars(
  service: ServiceClient,
  entityType: AutomationEntityType,
  entityId: string
): Promise<RunVars | null> {
  switch (entityType) {
    case "booking": {
      const { data: booking } = await service
        .from("bookings")
        .select("customer_name, customer_email, customer_phone, check_in, check_out, tenant_id, products(title)")
        .eq("id", entityId)
        .maybeSingle();
      if (!booking) return null;
      const product = booking.products as unknown as { title: string } | null;
      const { data: tenant } = await service.from("tenants").select("slug").eq("id", booking.tenant_id).single();
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";
      const bookingLink = tenant ? `https://${tenant.slug}.${platformDomain}/checkout/sucesso?bookingId=${entityId}` : "";
      return {
        email: booking.customer_email,
        phone: booking.customer_phone,
        link: bookingLink,
        fields: {
          customer_name: booking.customer_name,
          product_title: product?.title ?? "produto",
          check_in: booking.check_in ? new Date(booking.check_in).toLocaleDateString("pt-BR") : "",
          check_out: booking.check_out ? new Date(booking.check_out).toLocaleDateString("pt-BR") : "",
          booking_code: entityId.slice(0, 8).toUpperCase(),
          link: bookingLink,
        },
      };
    }
    case "lead": {
      const { data: lead } = await service
        .from("leads")
        .select("name, email, phone, created_at")
        .eq("id", entityId)
        .maybeSingle();
      if (!lead) return null;
      const days = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
      return { email: lead.email, phone: lead.phone, fields: { customer_name: lead.name, days: String(days) } };
    }
    case "quote": {
      const { data: quote } = await service
        .from("quotes")
        .select("token, tenant_id, leads(name, email, phone), products(title)")
        .eq("id", entityId)
        .maybeSingle();
      if (!quote) return null;
      const lead = quote.leads as unknown as { name: string; email: string; phone: string | null } | null;
      const product = quote.products as unknown as { title: string } | null;
      const { data: tenant } = await service.from("tenants").select("slug").eq("id", quote.tenant_id).single();
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";
      const quoteUrl = tenant ? `https://${tenant.slug}.${platformDomain}/cotacao/${quote.token}` : "";
      return {
        email: lead?.email ?? null,
        phone: lead?.phone ?? null,
        link: quoteUrl,
        fields: {
          customer_name: lead?.name ?? "cliente",
          product_title: product?.title ?? "produto",
          quote_url: quoteUrl,
          link: quoteUrl,
        },
      };
    }
    case "customer": {
      const { data: customer } = await service
        .from("customers")
        .select("name, email, phone")
        .eq("id", entityId)
        .maybeSingle();
      if (!customer) return null;
      return { email: customer.email, phone: customer.phone, fields: { customer_name: customer.name } };
    }
    default:
      return null;
  }
}

async function markRun(
  service: ServiceClient,
  runId: string,
  status: "executed" | "failed" | "skipped",
  error: string | null
) {
  await service
    .from("automation_runs")
    .update({ status, error, executed_at: new Date().toISOString() })
    .eq("id", runId);
}

interface RunRow {
  id: string;
  entity_type: AutomationEntityType;
  entity_id: string;
  automations: Automation;
}

async function executeRun(service: ServiceClient, run: RunRow): Promise<"executed" | "failed" | "skipped"> {
  const automation = run.automations;

  try {
    const vars = await buildVars(service, run.entity_type, run.entity_id);
    if (!vars) {
      await markRun(service, run.id, "skipped", "Entidade não encontrada (pode ter sido removida).");
      return "skipped";
    }

    if (automation.action_type === "send_whatsapp") {
      if (!vars.phone) {
        await markRun(service, run.id, "skipped", "Destinatário sem telefone.");
        return "skipped";
      }
      const cfg = automation.action_config as unknown as WhatsAppActionConfig;
      const template = getWhatsAppTemplate(cfg.template_key);
      if (!template) {
        await markRun(service, run.id, "skipped", "Template de WhatsApp inválido.");
        return "skipped";
      }

      const { data: integrations } = await service
        .from("tenant_integrations")
        .select("whatsapp_status, whatsapp_api_key_encrypted")
        .eq("tenant_id", automation.tenant_id)
        .single();

      if (!integrations || integrations.whatsapp_status !== "connected" || !integrations.whatsapp_api_key_encrypted) {
        await markRun(service, run.id, "skipped", "WhatsApp Business API não conectado para este tenant.");
        return "skipped";
      }

      // Circuit breaker: a runaway automation or compromised account must not
      // flood Meta and get the tenant's number banned. Pause and alert instead.
      const circuit = await checkWhatsAppCircuit(service, automation.tenant_id);
      if (!circuit.allowed) {
        await tripWhatsAppCircuit(service, automation.tenant_id, circuit.count);
        await markRun(service, run.id, "skipped", "Limite de segurança de envios de WhatsApp atingido (circuit breaker).");
        return "skipped";
      }

      const normalizedPhone = normalizePhone(vars.phone);
      const orderedParams = template.paramKeys.map((key) => vars.fields[key] ?? "");

      try {
        const apiKey = decrypt(integrations.whatsapp_api_key_encrypted);
        await sendWhatsAppTemplate({
          apiKey,
          to: normalizedPhone,
          templateName: template.metaName,
          language: template.language,
          params: orderedParams,
        });
        await service.from("whatsapp_logs").insert({
          tenant_id: automation.tenant_id,
          phone: normalizedPhone,
          template: cfg.template_key,
          status: "sent",
        });
      } catch (err) {
        await service.from("whatsapp_logs").insert({
          tenant_id: automation.tenant_id,
          phone: normalizedPhone,
          template: cfg.template_key,
          status: "failed",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
        throw err;
      }
    } else if (automation.action_type === "send_email") {
      if (!vars.email) {
        await markRun(service, run.id, "skipped", "Destinatário sem e-mail.");
        return "skipped";
      }
      const cfg = automation.action_config as unknown as EmailActionConfig;
      const [{ data: tenant }, { data: theme }] = await Promise.all([
        service.from("tenants").select("name, slug").eq("id", automation.tenant_id).single(),
        service.from("themes").select("primary_color").eq("tenant_id", automation.tenant_id).maybeSingle(),
      ]);
      if (!tenant) throw new Error("Tenant não encontrado.");

      const fields = { ...vars.fields, quote_url: vars.link ?? vars.fields.quote_url ?? "" };
      const html = renderAutomationEmailHtml({
        heading: renderTemplate(cfg.heading, fields),
        body: renderTemplate(cfg.body, fields),
        tenantName: tenant.name,
        primaryColor: theme?.primary_color,
        ctaLabel: cfg.cta_label,
        ctaUrl: cfg.cta_url ? renderTemplate(cfg.cta_url, fields) : undefined,
      });

      await sendEmail({
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        to: vars.email,
        subject: renderTemplate(cfg.subject, fields),
        html,
      });
    } else if (automation.action_type === "internal_notification") {
      const cfg = automation.action_config as unknown as NotificationActionConfig;
      await service.from("notifications").insert({
        tenant_id: automation.tenant_id,
        title: renderTemplate(cfg.title, vars.fields),
        message: renderTemplate(cfg.message, vars.fields),
        link: vars.link ?? null,
      });
    } else if (automation.action_type === "move_lead_status") {
      if (run.entity_type !== "lead") {
        await markRun(service, run.id, "skipped", "Ação só é válida para gatilhos de lead.");
        return "skipped";
      }
      const cfg = automation.action_config as unknown as MoveLeadActionConfig;
      await service.from("leads").update({ status: cfg.next_status }).eq("id", run.entity_id);
    }

    await markRun(service, run.id, "executed", null);
    return "executed";
  } catch (err) {
    await markRun(service, run.id, "failed", err instanceof Error ? err.message : "Erro desconhecido.");
    return "failed";
  }
}
