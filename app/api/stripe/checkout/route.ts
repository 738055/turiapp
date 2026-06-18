export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe, createStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { roleAtLeast } from "@/lib/auth/roles";

// Subscription checkout for the PLATFORM's own billing (tenant pays TuriApp).
// If the tenant already has an active subscription, switch plans in place with
// proration; otherwise open a Stripe Checkout session (which collects a card and
// starts the 14-day trial). Owner-only — billing is the owner's responsibility.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const planId = String(form.get("plan_id") ?? "");
  const priceId = String(form.get("price_id") ?? "");

  if (!priceId) {
    return NextResponse.redirect(new URL("/configuracoes/assinatura?error=plano", req.url), 303);
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || !roleAtLeast(membership.role, "tenant_owner")) {
    return NextResponse.redirect(new URL("/configuracoes/assinatura?error=permissao", req.url), 303);
  }

  const { data: tenant } = await service
    .from("tenants")
    .select("id, name, stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", membership.tenant_id)
    .single();

  if (!tenant) return NextResponse.redirect(new URL("/configuracoes/assinatura", req.url), 303);

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const baseUrl = `${proto}://${host}`;

  // Ensure a Stripe customer exists.
  let customerId = tenant.stripe_customer_id;
  if (!customerId) {
    customerId = await createStripeCustomer(user.email ?? "", tenant.name, tenant.id);
    await service.from("tenants").update({ stripe_customer_id: customerId }).eq("id", tenant.id);
  }

  // Persist the chosen plan now so the panel reflects it; the webhook re-syncs
  // plan_id from the actual subscription price as the source of truth.
  if (planId) {
    await service.from("tenants").update({ plan_id: planId }).eq("id", tenant.id);
  }

  const hasActiveSub =
    tenant.stripe_subscription_id &&
    ["active", "trialing", "past_due"].includes(tenant.subscription_status ?? "");

  try {
    if (hasActiveSub) {
      // Switch plans in place with proration (upgrade or downgrade).
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id!);
      const itemId = sub.items.data[0]?.id;
      if (itemId) {
        await stripe.subscriptions.update(tenant.stripe_subscription_id!, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: "create_prorations",
        });
      }
      await writeAuditLog({
        tenant_id: tenant.id,
        user_id: user.id,
        action: "billing.plan_changed",
        resource: "subscriptions",
        ip_address: getClientIp(req),
        metadata: { plan_id: planId, price_id: priceId },
      });
      return NextResponse.redirect(new URL("/configuracoes/assinatura?changed=1", req.url), 303);
    }

    const url = await createCheckoutSession(
      customerId,
      priceId,
      `${baseUrl}/configuracoes/assinatura?subscribed=1`,
      `${baseUrl}/configuracoes/assinatura?cancelled=1`
    );
    await writeAuditLog({
      tenant_id: tenant.id,
      user_id: user.id,
      action: "billing.checkout_started",
      resource: "subscriptions",
      ip_address: getClientIp(req),
      metadata: { plan_id: planId, price_id: priceId },
    });
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(new URL("/configuracoes/assinatura?error=stripe", req.url), 303);
  }
}
