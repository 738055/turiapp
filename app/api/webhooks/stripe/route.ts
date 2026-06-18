export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPlatformEmail, renderDunningEmailHtml } from "@/lib/email/resend";
import { convertReferral } from "@/lib/affiliates/convert";
import type Stripe from "stripe";

// Map a Stripe subscription status to our tenant.status. past_due is treated as
// a GRACE period (tenant stays active while Stripe retries — dunning); only when
// retries are exhausted (unpaid / incomplete_expired) does the tenant get
// suspended. canceled → inactive.
function tenantStatusFor(stripeStatus: string): "active" | "inactive" | "suspended" {
  if (stripeStatus === "active" || stripeStatus === "trialing" || stripeStatus === "past_due") return "active";
  if (stripeStatus === "canceled") return "inactive";
  return "suspended"; // unpaid, incomplete, incomplete_expired, paused
}

// tenants.subscription_status is constrained to a fixed set. Stripe emits more
// statuses (incomplete, incomplete_expired, paused) — map those to the nearest
// allowed value so the UPDATE never violates the DB check constraint.
const ALLOWED_SUB_STATUS = new Set(["active", "trialing", "past_due", "canceled", "unpaid"]);
function clampSubscriptionStatus(stripeStatus: string): string {
  if (ALLOWED_SUB_STATUS.has(stripeStatus)) return stripeStatus;
  if (stripeStatus === "incomplete" || stripeStatus === "incomplete_expired") return "unpaid";
  if (stripeStatus === "paused") return "past_due";
  return "unpaid";
}

// Resolve the tenant's plan_id from the subscription's price, so the panel
// always reflects the plan actually being billed.
async function syncPlanFromSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  sub: Stripe.Subscription
) {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return;
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .maybeSingle();
  if (plan) await supabase.from("tenants").update({ plan_id: plan.id }).eq("id", tenantId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!tenant) break;

      // Map Stripe status to our status
      const status = sub.status as string;

      await supabase.from("subscriptions").upsert({
        tenant_id: tenant.id,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customerId,
        status,
        current_period_start: new Date((sub as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000).toISOString(),
        current_period_end: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at
          ? new Date(sub.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "tenant_id" });

      await supabase
        .from("tenants")
        .update({
          subscription_status: clampSubscriptionStatus(status),
          stripe_subscription_id: sub.id,
          status: tenantStatusFor(status),
        })
        .eq("id", tenant.id);

      await syncPlanFromSubscription(supabase, tenant.id, sub);

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: paidTenant } = await supabase
        .from("tenants")
        .update({ subscription_status: "active", status: "active" })
        .eq("stripe_customer_id", customerId)
        .select("id")
        .maybeSingle();

      // First payment converts a pending affiliate referral.
      if (paidTenant) await convertReferral(supabase, paidTenant.id);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const attempt = invoice.attempt_count ?? 1;
      // Stripe keeps retrying (Smart Retries). Stay in past_due / active (grace)
      // until retries are exhausted, which arrives as a subscription.updated with
      // status unpaid → suspended via tenantStatusFor. Each failure sends a
      // dunning email (the D+1/D+3/D+7 cadence is driven by Stripe's retries).
      const finalWarning = invoice.next_payment_attempt === null;

      await supabase
        .from("tenants")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("stripe_customer_id", customerId)
        .single();

      const to = invoice.customer_email ?? null;
      if (tenant && to) {
        const appHost = process.env.NEXT_PUBLIC_APP_HOST ?? `app.${process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br"}`;
        try {
          await sendPlatformEmail({
            to,
            subject: finalWarning ? "Último aviso: sua assinatura TuriApp" : "Falha no pagamento da sua assinatura TuriApp",
            html: renderDunningEmailHtml({
              tenantName: tenant.name,
              attempt,
              manageUrl: `https://${appHost}/configuracoes/assinatura`,
              finalWarning,
            }),
          });
        } catch {
          // Dunning email failure must not break the webhook ack.
        }
      }

      break;
    }

    default:
      // Unknown event — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
