"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { cartCount, CART_EVENT } from "@/lib/cart/store";

// Floating cart indicator, rendered site-wide in the public layout. Hidden when
// the cart is empty so it never gets in the way on storefronts that don't use it.
export function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (count === 0) return null;

  return (
    <a
      href="/carrinho"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}
      aria-label="Ver carrinho"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">{count}</span>
    </a>
  );
}
