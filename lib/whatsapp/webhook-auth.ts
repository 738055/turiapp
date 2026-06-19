import crypto from "crypto";

/**
 * Token determinístico e inforjável por tenant para o webhook de entrada do
 * WhatsApp. Deriva de HMAC(ENCRYPTION_KEY, tenant_id) — não precisa de coluna no
 * banco e é verificável. Quem não tem a ENCRYPTION_KEY não consegue gerar um
 * token válido, então não dá para falsificar mensagens de entrada conhecendo só
 * o slug.
 */
export function whatsappWebhookToken(tenantId: string): string {
  const key = process.env.ENCRYPTION_KEY ?? "";
  return crypto.createHmac("sha256", key).update(`wa-webhook:${tenantId}`).digest("hex").slice(0, 32);
}

export function verifyWhatsappWebhookToken(tenantId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = whatsappWebhookToken(tenantId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
