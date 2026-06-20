// app/lib/tracking.ts
// Helpers centralizados para GTM DataLayer + Meta Pixel
// Use estas funções em qualquer componente client-side.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

function pushDataLayer(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // Limpa ecommerce anterior antes de cada evento (padrão GA4)
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ...data });
}

function pushPixel(eventName: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, data);
  }
}

// ── Tipos internos ──────────────────────────────────────────────────────────

interface TrackItem {
  id: string;
  name: string;
  price: number;
  type: string;
  quantity?: number;
}

// ── Eventos ─────────────────────────────────────────────────────────────────

/** Disparado quando o usuário abre a página de detalhe */
export function trackViewItem(item: TrackItem) {
  pushDataLayer('view_item', {
    ecommerce: {
      currency: 'BRL',
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
          item_category: item.type,
        },
      ],
    },
  });
  pushPixel('ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'BRL',
  });
}

/** Disparado ao clicar em um card da listagem/carrossel */
export function trackSelectItem(item: TrackItem) {
  pushDataLayer('select_item', {
    ecommerce: {
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          item_category: item.type,
        },
      ],
    },
  });
}

/** Disparado ao adicionar ao carrinho */
export function trackAddToCart(item: TrackItem, total: number) {
  pushDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'BRL',
      value: total,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity ?? 1,
          item_category: item.type,
        },
      ],
    },
  });
  pushPixel('AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    value: total,
    currency: 'BRL',
  });
}

/** Disparado ao clicar em "Comprar agora" / ir para checkout */
export function trackBeginCheckout(
  total: number,
  items: { id: string; name: string; price: number; type: string; quantity?: number }[]
) {
  pushDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'BRL',
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity ?? 1,
        item_category: i.type,
      })),
    },
  });
  pushPixel('InitiateCheckout', { value: total, currency: 'BRL', num_items: items.length });
}

/** Disparado na página de sucesso */
export function trackPurchase(
  transactionId: string,
  total: number,
  items: { id: string; name: string; price: number; type: string; quantity?: number }[]
) {
  pushDataLayer('purchase', {
    ecommerce: {
      transaction_id: transactionId,
      currency: 'BRL',
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity ?? 1,
        item_category: i.type,
      })),
    },
  });
  pushPixel('Purchase', { value: total, currency: 'BRL' });
}
