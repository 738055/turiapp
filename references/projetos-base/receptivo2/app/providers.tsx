'use client';

import { LanguageProvider } from '@/app/contexts/LanguageContext';
import { ContentProvider } from '@/app/contexts/ContentContext';
import { CartProvider } from '@/app/contexts/CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ContentProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ContentProvider>
    </LanguageProvider>
  );
}