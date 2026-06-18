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
