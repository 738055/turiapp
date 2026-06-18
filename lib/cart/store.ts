// Client-side cart kept in localStorage (per storefront origin = per tenant).
// No server cart table / TTL cleanup needed. The server re-validates every item
// and re-computes prices at checkout, so a tampered cart can't change what's
// actually charged.

export interface CartItem {
  id: string;
  product_id: string;
  slug: string;
  title: string;
  image?: string | null;
  rate_id: string;
  rate_name: string;
  rate_type: string;
  unit_price: number;
  currency: string;
  qty: number;
  checkin: string | null;
  checkout: string | null;
  guests: number;
  total: number;
}

const KEY = "turiapp_cart";
export const CART_EVENT = "turiapp:cart-updated";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addItem(item: CartItem) {
  const items = getCart();
  items.push(item);
  save(items);
}

export function removeItem(id: string) {
  save(getCart().filter((i) => i.id !== id));
}

export function updateQty(id: string, qty: number) {
  const items = getCart().map((i) =>
    i.id === id ? { ...i, qty: Math.max(1, qty), total: round2(i.unit_price * perUnitMultiplier(i) * Math.max(1, qty)) } : i
  );
  save(items);
}

export function clearCart() {
  save([]);
}

export function cartCount(): number {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

export function cartTotal(): number {
  return round2(getCart().reduce((s, i) => s + i.total, 0));
}

// nights/guests are already baked into unit calculation when the item is added;
// for qty changes we only scale by qty, so the per-unit multiplier is 1 here.
function perUnitMultiplier(_i: CartItem): number {
  return 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
