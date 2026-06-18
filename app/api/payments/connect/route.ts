export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { validateMPCredentials } from "@/lib/mercadopago";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

const stripeSchema = z.object({
  provider: z.literal("stripe"),
  tenant_id: z.string().uuid(),
  secret_key: z.string().min(20),
  webhook_secret: z.string().optional(),
});

const mpSchema = z.object({
  provider: z.literal("mercadopago"),
  tenant_id: z.string().uuid(),
  access_token: z.string().min(20),
  public_key: z.string().optional(),
});

const schema = z.discriminatedUnion("provider", [stripeSchema, mpSchema]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const service = createServiceClient();

  // Membership check
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", d.tenant_id)
    .eq("user_id", user.id)
    .single();

  // Owner-only: mirrors the tenant_payment_accounts RLS (has_tenant_role('tenant_owner')).
  // The route runs as service_role and bypasses RLS, so the role gate must match
  // the policy — otherwise an admin could connect/rotate payment credentials via
  // the API while being forbidden to do so directly. (Etapa 16 RBAC hardening.)
  if (!membership || !["tenant_owner", "owner", "super_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Apenas o proprietário da conta pode gerenciar pagamentos." }, { status: 403 });
  }

  // Connecting a payment gateway only makes sense with the online booking engine,
  // which is plan-gated. Básico (WhatsApp-only) can't connect payments.
  const planLimits = await getPlanLimits(service, d.tenant_id);
  if (!featureAllowed(planLimits, "booking_engine")) {
    return NextResponse.json(
      { error: "Pagamentos online não estão incluídos no seu plano. Faça upgrade para o Pro para receber pagamentos pelo site." },
      { status: 403 }
    );
  }

  // Validate credentials before saving
  try {
    if (d.provider === "stripe") {
      const { Stripe } = await import("stripe");
      const testStripe = new Stripe(d.secret_key, { apiVersion: "2026-05-27.dahlia", typescript: true });
      // balance.retrieve validates credentials without requiring extra parameters
      await testStripe.balance.retrieve();
    } else {
      const valid = await validateMPCredentials(d.access_token);
      if (!valid) {
        return NextResponse.json({ error: "Credenciais do Mercado Pago inválidas." }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Credenciais inválidas ou sem permissão." }, { status: 400 });
  }

  // Encrypt and upsert
  let encryptedCredentials: Record<string, string>;
  if (d.provider === "stripe") {
    encryptedCredentials = {
      secret_key: encrypt(d.secret_key),
      ...(d.webhook_secret ? { webhook_secret: encrypt(d.webhook_secret) } : {}),
    };
  } else {
    encryptedCredentials = {
      access_token: encrypt(d.access_token),
      ...(d.public_key ? { public_key: encrypt(d.public_key) } : {}),
    };
  }

  const { error } = await service
    .from("tenant_payment_accounts")
    .upsert(
      {
        tenant_id: d.tenant_id,
        provider: d.provider,
        encrypted_credentials: JSON.stringify(encryptedCredentials),
        status: "connected",
        connected_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,provider" }
    );

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar credenciais." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
