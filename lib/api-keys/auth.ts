import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/crypto";
import { enforceRateLimit } from "@/lib/rate-limit";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** Generates a new plaintext API key. Only the hash is ever persisted — the plaintext is shown once at creation. */
export function generateApiKey(): { key: string; prefix: string } {
  const key = `tur_${generateToken(24)}`;
  return { key, prefix: key.slice(0, 12) };
}

export type ApiKeyScope = "full" | "read_only";

export interface ApiKeyAuth {
  tenantId: string;
  apiKeyId: string;
  scope: ApiKeyScope;
}

export interface ApiKeyAuthError {
  error: string;
  status: number;
}

export async function authenticateApiKey(req: Request): Promise<ApiKeyAuth | ApiKeyAuthError> {
  const authHeader = req.headers.get("authorization");
  const key = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!key) return { error: "Chave de API ausente.", status: 401 };

  const service = createServiceClient();
  const keyHash = hashApiKey(key);

  const { data: apiKey } = await service
    .from("api_keys")
    .select("id, tenant_id, revoked_at, scope")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey || apiKey.revoked_at) {
    return { error: "Chave de API inválida ou revogada.", status: 401 };
  }

  const rl = await enforceRateLimit({ key: `api-key:${apiKey.id}`, limit: 500, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: "Limite de requisições excedido (500/hora).", status: 429 };
  }

  await service.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

  return { tenantId: apiKey.tenant_id, apiKeyId: apiKey.id, scope: (apiKey.scope as ApiKeyScope) ?? "full" };
}

export function isApiKeyAuthError(result: ApiKeyAuth | ApiKeyAuthError): result is ApiKeyAuthError {
  return "error" in result;
}

/** Returns a 403 error if the authenticated key is read-only; otherwise null. Call before any write. */
export function requireWriteScope(auth: ApiKeyAuth): ApiKeyAuthError | null {
  if (auth.scope === "read_only") {
    return { error: "Esta chave é somente leitura e não pode realizar esta operação.", status: 403 };
  }
  return null;
}
