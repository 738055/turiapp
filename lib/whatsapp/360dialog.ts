/**
 * 360dialog WhatsApp Business (Cloud API) integration via direct HTTP calls.
 * Docs: https://docs.360dialog.com/
 *
 * Endpoint paths follow 360dialog's published Cloud API contract at the time
 * of writing — confirm against current docs before going live, since these
 * are versioned by the provider and can change.
 */

const API_BASE = "https://waba-v2.360dialog.io";

async function request<T>(endpoint: string, apiKey: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "D360-API-KEY": apiKey,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`360dialog API error ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<T>;
}

export interface SendTemplateOptions {
  apiKey: string;
  to: string;
  templateName: string;
  language: string;
  params: string[];
}

export interface SendTemplateResult {
  messageId?: string;
}

export async function sendWhatsAppTemplate(opts: SendTemplateOptions): Promise<SendTemplateResult> {
  const body = await request<{ messages?: { id: string }[] }>("/messages", opts.apiKey, {
    method: "POST",
    body: JSON.stringify({
      to: opts.to,
      type: "template",
      template: {
        name: opts.templateName,
        language: { code: opts.language },
        components: [
          {
            type: "body",
            parameters: opts.params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });

  return { messageId: body.messages?.[0]?.id };
}

/** Free-form text message — só permitido dentro da janela de 24h após a última
 *  mensagem do cliente (regra da Meta). Fora dela, use sendWhatsAppTemplate. */
export async function sendWhatsAppText(opts: { apiKey: string; to: string; body: string }): Promise<SendTemplateResult> {
  const body = await request<{ messages?: { id: string }[] }>("/messages", opts.apiKey, {
    method: "POST",
    body: JSON.stringify({
      to: opts.to,
      type: "text",
      text: { body: opts.body },
    }),
  });
  return { messageId: body.messages?.[0]?.id };
}

export interface WhatsAppRemoteTemplate {
  name: string;
  language: string;
  status: string;
  category?: string;
  bodyText: string;
  paramCount: number;
}

interface RawTemplate {
  name?: string;
  language?: string | { code?: string };
  status?: string;
  category?: string;
  components?: { type?: string; text?: string }[];
}

function parseTemplate(t: RawTemplate): WhatsAppRemoteTemplate {
  const language = typeof t.language === "string" ? t.language : t.language?.code ?? "pt_BR";
  const body = (t.components ?? []).find((c) => (c.type ?? "").toUpperCase() === "BODY");
  const bodyText = body?.text ?? "";
  const paramCount = (bodyText.match(/\{\{\s*\d+\s*\}\}/g) ?? []).length;
  return { name: t.name ?? "", language, status: (t.status ?? "").toUpperCase(), category: t.category, bodyText, paramCount };
}

/**
 * Lista os templates aprovados da conta do tenant no 360dialog. Endpoint pode
 * variar conforme a conta (Cloud vs on-premise) — tentamos os caminhos
 * conhecidos. Retorna só os APROVADOS.
 */
export async function listWhatsAppTemplates(apiKey: string): Promise<WhatsAppRemoteTemplate[]> {
  const endpoints = ["/v1/configs/templates", "/v1/templates"];
  for (const ep of endpoints) {
    try {
      const data = await request<{ waba_templates?: RawTemplate[]; data?: RawTemplate[] }>(ep, apiKey);
      const list = data.waba_templates ?? data.data ?? [];
      if (Array.isArray(list)) {
        return list.map(parseTemplate).filter((t) => t.name && t.status === "APPROVED");
      }
    } catch {
      // tenta o próximo endpoint
    }
  }
  return [];
}

/** Envia midia por LINK publico; a Meta busca a URL.
 *  Só permitido dentro da janela de 24h (mensagem de sessão). */
export type WhatsAppMediaType = "image" | "document" | "audio" | "video";

export async function sendWhatsAppMedia(opts: {
  apiKey: string; to: string; type: WhatsAppMediaType; link: string; caption?: string; filename?: string;
}): Promise<SendTemplateResult> {
  const media: Record<string, unknown> = { link: opts.link };
  if (opts.caption && opts.type !== "audio") media.caption = opts.caption;
  if (opts.type === "document" && opts.filename) media.filename = opts.filename;
  const body = await request<{ messages?: { id: string }[] }>("/messages", opts.apiKey, {
    method: "POST",
    body: JSON.stringify({ to: opts.to, type: opts.type, [opts.type]: media }),
  });
  return { messageId: body.messages?.[0]?.id };
}

/** Baixa os bytes de uma mídia recebida. Tenta o fluxo Cloud (GET /{id} → url →
 *  download) e o on-premise (GET /v1/media/{id} → binário). Retorna null se não
 *  conseguir — o chat degrada para "[imagem]" sem quebrar. */
export async function downloadWhatsAppMedia(apiKey: string, mediaId: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const meta = await fetch(`${API_BASE}/${mediaId}`, { headers: { "D360-API-KEY": apiKey }, signal: AbortSignal.timeout(8000) });
    if (meta.ok) {
      const j = (await meta.json()) as { url?: string; mime_type?: string };
      if (j.url) {
        const bin = await fetch(j.url, { headers: { "D360-API-KEY": apiKey }, signal: AbortSignal.timeout(10000) });
        if (bin.ok) return { bytes: await bin.arrayBuffer(), contentType: j.mime_type ?? bin.headers.get("content-type") ?? "application/octet-stream" };
      }
    }
  } catch { /* tenta o próximo */ }
  try {
    const bin = await fetch(`${API_BASE}/v1/media/${mediaId}`, { headers: { "D360-API-KEY": apiKey }, signal: AbortSignal.timeout(10000) });
    if (bin.ok) return { bytes: await bin.arrayBuffer(), contentType: bin.headers.get("content-type") ?? "application/octet-stream" };
  } catch { /* desiste */ }
  return null;
}

export async function validateWhatsAppCredentials(apiKey: string): Promise<boolean> {
  try {
    await request("/v1/configs/webhook", apiKey);
    return true;
  } catch {
    return false;
  }
}

/** Strips formatting, keeping only digits (E.164-style, no leading +) — same convention as the wa.me button. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
