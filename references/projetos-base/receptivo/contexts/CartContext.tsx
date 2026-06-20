'use client'; // <--- Essencial para contextos que usam estado e localStorage

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '@/types';
import { useRouter } from 'next/navigation'; // Usar useRouter do Next.js
import { trackEvent } from '@/utils/analytics';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  checkout: () => void;
  total: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Garante que só acessamos o localStorage no cliente para evitar erros de hidratação
  useEffect(() => {
    setIsClient(true);
    const savedCart = localStorage.getItem('a10_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro ao ler carrinho:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('a10_cart', JSON.stringify(items));
    }
  }, [items, isClient]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => [...prev, item]);
    
    // Rastreamento Profissional
    trackEvent('AddToCart', {
      value: item.price,
      currency: 'BRL',
      items: [{
        item_id: item.tourId,
        item_name: item.tourTitle,
        price: item.pricingType === 'per_person' && item.guests > 0 ? item.price / item.guests : item.price,
        quantity: item.pricingType === 'per_person' ? item.guests : 1,
      }]
    });
    // Se usar react-hot-toast: toast.success('Item adicionado ao carrinho!');
  };

  const removeFromCart = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    // toast.success('Item removido.');
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((acc, item) => acc + item.price, 0);
  const itemsCount = items.length;

  const checkout = () => {
    if (items.length === 0) return;
    router.push('/checkout'); // Navegação estilo SPA
  };

  // Evita renderizar no servidor para não dar conflito com localStorage
  if (!isClient) {
      return null; 
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, checkout, total, itemsCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};