import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy Stripe client — only instantiated at runtime when the secret key is available. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia", typescript: true });
  }
  return _stripe;
}

/** Named export for convenience in server actions and route handlers. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function createStripeCustomer(
  email: string,
  name: string,
  tenantId: string
): Promise<string> {
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { tenant_id: tenantId },
  });
  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: { trial_period_days: 14 },
  });
  return session.url!;
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
