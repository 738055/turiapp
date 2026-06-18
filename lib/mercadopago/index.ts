/**
 * Mercado Pago integration via direct HTTP calls to avoid SDK
 * bundling issues (the SDK auto-initializes on import).
 * Docs: https://www.mercadopago.com.br/developers/pt/reference
 */

const MP_BASE_URL = "https://api.mercadopago.com";

async function mpRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${MP_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mercado Pago API error ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<T>;
}

export interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MPPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MPPayer {
  name?: string;
  email: string;
}

export interface PreferenceOptions {
  /** Max card installments offered on the MP hosted checkout (Brazil). */
  maxInstallments?: number;
  /** Exclude boleto (ticket) — boleto is offered by default otherwise. */
  excludeBoleto?: boolean;
  /** Server-to-server IPN/webhook URL for this preference's payments. */
  notificationUrl?: string;
}

export async function createPreference(
  accessToken: string,
  items: MPPreferenceItem[],
  payer: MPPayer,
  backUrls: { success: string; failure: string; pending: string },
  externalReference?: string,
  options: PreferenceOptions = {}
): Promise<MPPreference> {
  // Checkout Pro shows card (with installments), PIX and boleto by default. We
  // set the installment cap and only exclude boleto when asked.
  const payment_methods: Record<string, unknown> = {
    installments: options.maxInstallments ?? 12,
  };
  if (options.excludeBoleto) {
    payment_methods.excluded_payment_types = [{ id: "ticket" }];
  }

  return mpRequest<MPPreference>("/checkout/preferences", accessToken, {
    method: "POST",
    body: JSON.stringify({
      items,
      payer,
      back_urls: backUrls,
      auto_return: "approved",
      external_reference: externalReference,
      payment_methods,
      ...(options.notificationUrl ? { notification_url: options.notificationUrl } : {}),
    }),
  });
}

export interface PixPaymentResult {
  id: number;
  status: string;
  qr_code: string; // copy-paste PIX code
  qr_code_base64: string; // PNG image (base64)
  ticket_url?: string;
  expiration?: string | null;
}

/**
 * Creates a direct PIX payment via /v1/payments. Returns the QR code (copy-paste
 * string + base64 PNG). Confirmation arrives through the same Mercado Pago
 * webhook used by Checkout (matched by external_reference = bookingId), so no
 * separate confirmation path is needed. An idempotency key scoped to the booking
 * stops a page reload from generating a second charge.
 */
export async function createPixPayment(
  accessToken: string,
  params: {
    amount: number;
    description: string;
    payerEmail: string;
    payerFirstName?: string;
    payerLastName?: string;
    externalReference: string;
    notificationUrl?: string;
    expiresInMinutes?: number;
  }
): Promise<PixPaymentResult> {
  const expiresAt = new Date(Date.now() + (params.expiresInMinutes ?? 30) * 60 * 1000);

  const payment = await mpRequest<{
    id: number;
    status: string;
    date_of_expiration?: string;
    point_of_interaction?: {
      transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
    };
  }>("/v1/payments", accessToken, {
    method: "POST",
    headers: { "X-Idempotency-Key": `pix-${params.externalReference}` },
    body: JSON.stringify({
      transaction_amount: Number(params.amount.toFixed(2)),
      description: params.description,
      payment_method_id: "pix",
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      date_of_expiration: expiresAt.toISOString(),
      payer: {
        email: params.payerEmail,
        first_name: params.payerFirstName,
        last_name: params.payerLastName,
      },
    }),
  });

  const td = payment.point_of_interaction?.transaction_data;
  return {
    id: payment.id,
    status: payment.status,
    qr_code: td?.qr_code ?? "",
    qr_code_base64: td?.qr_code_base64 ?? "",
    ticket_url: td?.ticket_url,
    expiration: payment.date_of_expiration ?? expiresAt.toISOString(),
  };
}

export async function getPayment(accessToken: string, paymentId: string) {
  return mpRequest<Record<string, unknown>>(
    `/v1/payments/${paymentId}`,
    accessToken
  );
}

export async function validateMPCredentials(accessToken: string): Promise<boolean> {
  try {
    await mpRequest("/users/me", accessToken);
    return true;
  } catch {
    return false;
  }
}
