import React from 'react';
import Button from './Button';
import Link from 'next/link';
import { translations } from '@/utils/translations';

const HotelBanner = () => {
  // NOTE: In a real app, language would come from a context. Hardcoding for now.
  const t = translations.pt.hotelBanner;

  return (
    <section className="bg-secondary/10 py-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-serif font-bold text-primary mb-2">{t.title}</h2>
        <p className="text-gray-600 mb-6">{t.subtitle}</p>
        <Link href="https://wa.me/5545991083852" target="_blank" rel="noopener noreferrer">
          <Button variant="primary">{t.cta}</Button>
        </Link>
      </div>
    </section>
  );
};

export default HotelBanner;