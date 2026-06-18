export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/stripe";
import { roleAtLeast } from "@/lib/auth/roles";

// Opens the Stripe Billing Portal so the owner can manage card, invoices, and
// cancellation themselves. Owner-only.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

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
    .select("stripe_customer_id")
    .eq("id", membership.tenant_id)
    .single();

  if (!tenant?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/configuracoes/assinatura?error=sem_assinatura", req.url), 303);
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const returnUrl = `${proto}://${host}/configuracoes/assinatura`;

  try {
    const url = await createCustomerPortalSession(tenant.stripe_customer_id, returnUrl);
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(new URL("/configuracoes/assinatura?error=stripe", req.url), 303);
  }
}
