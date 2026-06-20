'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '@/app/types';

interface CartContextType {
  cartItems: CartItem[];
  items: CartItem[]; // Alias para compatibilidade
  // Adicionado selectedTiers na assinatura
  addToCart: (product: Product, date: string, adults: number, children: number, selectedExtras: Record<string, number>, time?: string, selectedTiers?: Record<string, number>) => void;
  removeFromCart: (internalId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const defaultContext: CartContextType = {
  cartItems: [],
  items: [], 
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  cartTotal: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
};

const CartContext = createContext<CartContextType>(defaultContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 1. Carregar do LocalStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('reserva_cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
             setCartItems(parsed);
          }
        } catch (e) {
          console.error("Erro ao recuperar carrinho:", e);
          localStorage.removeItem('reserva_cart');
        }
      }
    }
  }, []);

  // Captura ID de afiliado da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('affiliate_id', ref);
      }
    }
  }, []);

  // 2. Salvar e Recalcular
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('reserva_cart', JSON.stringify(cartItems));
    }
    
    // Soma os subtotais
    const total = (cartItems || []).reduce((acc, item) => acc + (item.subtotal || 0), 0);
    setCartTotal(total);
  }, [cartItems, mounted]);

  const addToCart = (
    product: Product, 
    date: string, 
    adults: number, 
    children: number, 
    selectedExtras: Record<string, number>,
    time?: string,
    selectedTiers?: Record<string, number> // NOVO PARÂMETRO
  ) => {
    
    let configPrice = 0;

    // 1. Calcula Base (Tarifas Dinâmicas vs Padrão)
    if (selectedTiers && Object.keys(selectedTiers).length > 0 && product.pricingTiers) {
       // Usa as tarifas vindas do Wizard (ex: Doador de Sangue, Adulto, etc)
       product.pricingTiers.forEach(tier => {
           const qty = selectedTiers[tier.id] || 0;
           configPrice += qty * tier.price;
       });
    } else {
       // Fallback para o modo antigo
       configPrice = (product.price * adults) + ((product.price * 0.7) * children); 
    }
    
    // 2. Soma Extras
    if (product.extras && Array.isArray(product.extras)) {
       product.extras.forEach((extra: any) => {
          const key = extra.id || extra.name; 
          const qty = selectedExtras[key] || selectedExtras[extra.name] || 0;
          configPrice += qty * extra.price;
       });
    }

    // 3. Cria o objeto CartItem
    const newItem: CartItem = {
      product: product, 
      internalId: `${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date,
      time,
      adults,
      children,
      selectedExtras,
      selectedTiers, // Salva os tiers selecionados
      quantity: 1,
      price: configPrice, 
      subtotal: configPrice * 1 
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (internalId: string) => {
    setCartItems((prev) => prev.filter((item) => item.internalId !== internalId));
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reserva_cart');
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      items: cartItems, 
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);