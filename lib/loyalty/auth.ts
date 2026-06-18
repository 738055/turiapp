import crypto from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/crypto";

export const LOYALTY_COOKIE = "loyalty_session";
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** Generates and stores a login code for the email if it matches an existing customer of the tenant. Silent no-op otherwise (avoids leaking which emails are registered). */
export async function requestLoyaltyLoginCode(
  tenantId: string,
  email: string
): Promise<string | null> {
  const service = createServiceClient();

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  if (!customer) return null;

  const code = generateOtpCode();
  await service.from("loyalty_login_codes").insert({
    tenant_id: tenantId,
    email,
    code_hash: hashSecret(code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  return code;
}

export interface VerifyResult {
  token: string;
  customerId: string;
}

export async function verifyLoyaltyLoginCode(
  tenantId: string,
  email: string,
  code: string
): Promise<VerifyResult | { error: string }> {
  const service = createServiceClient();

  const { data: pending } = await service
    .from("loyalty_login_codes")
    .select("id, code_hash, expires_at, consumed_at, attempts")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending || new Date(pending.expires_at) < new Date()) {
    return { error: "Código expirado ou inválido. Solicite um novo código." };
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    return { error: "Número máximo de tentativas excedido. Solicite um novo código." };
  }

  if (hashSecret(code) !== pending.code_hash) {
    await service
      .from("loyalty_login_codes")
      .update({ attempts: pending.attempts + 1 })
      .eq("id", pending.id);
    return { error: "Código incorreto." };
  }

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .single();

  if (!customer) return { error: "Cliente não encontrado." };

  await service.from("loyalty_login_codes").update({ consumed_at: new Date().toISOString() }).eq("id", pending.id);

  const token = generateToken(32);
  await service.from("loyalty_sessions").insert({
    tenant_id: tenantId,
    customer_id: customer.id,
    token_hash: hashSecret(token),
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });

  return { token, customerId: customer.id };
}

export async function setLoyaltySessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(LOYALTY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearLoyaltySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(LOYALTY_COOKIE);
}

export interface LoyaltyCustomer {
  customerId: string;
  email: string;
  name: string;
}

/** Resolves the logged-in loyalty customer for the current tenant from the session cookie, if any. */
export async function getLoyaltySessionCustomer(tenantId: string): Promise<LoyaltyCustomer | null> {
  const store = await cookies();
  const token = store.get(LOYALTY_COOKIE)?.value;
  if (!token) return null;

  const service = createServiceClient();
  const { data: session } = await service
    .from("loyalty_sessions")
    .select("customer_id, expires_at")
    .eq("tenant_id", tenantId)
    .eq("token_hash", hashSecret(token))
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) return null;

  const { data: customer } = await service
    .from("customers")
    .select("id, email, name")
    .eq("id", session.customer_id)
    .single();

  if (!customer) return null;

  return { customerId: customer.id, email: customer.email, name: customer.name };
}
