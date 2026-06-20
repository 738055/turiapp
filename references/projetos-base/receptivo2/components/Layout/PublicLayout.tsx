'use client';

import React from 'react';
import { PratikNavbar } from '@/components/Frontend/PratikNavbar';
import { PratikFooter } from '@/components/Frontend/PratikFooter';
import { CartDrawer } from '../Cart/CartDrawer';
import PartnersCarousel from '@/components/PartnersCarousel';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 bg-gray-50/50">
      <CartDrawer />
      <PratikNavbar />
      
      <main className="flex-1">
        {children}
      </main>

      <PartnersCarousel />
      <PratikFooter />
    </div>
  );
};