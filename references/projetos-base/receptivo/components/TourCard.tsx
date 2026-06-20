'use client';

import React from 'react';
import Link from 'next/link';
import { Tour } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Tag } from 'lucide-react';

interface TourCardProps {
  tour: Tour;
}

const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  const { language, t } = useLanguage();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- NOVA LÓGICA DE PREÇO ---
  const getDisplayDetails = () => {
    let price = tour.basePrice;
    let isPromo = false;

    if (tour.pricingType === 'per_vehicle' && tour.vehicleTiers && tour.vehicleTiers.length > 0) {
      // Se for por veículo, pegamos o MENOR preço entre os tiers para o "A partir de"
      const prices = tour.vehicleTiers.map(tier => 
        (tier.promotionalPrice && tier.promotionalPrice > 0 && tier.promotionalPrice < tier.price) ? tier.promotionalPrice : tier.price
      );
      price = Math.min(...prices);
      
      // A promoção é verificada se algum tier tem preço promocional válido
      isPromo = tour.vehicleTiers.some(tier => tier.promotionalPrice && tier.promotionalPrice > 0 && tier.promotionalPrice < tier.price);
    } else {
      // Lógica padrão por pessoa
      if (tour.pricePromotional && tour.pricePromotional > 0 && tour.pricePromotional < tour.basePrice) {
        price = tour.pricePromotional;
        isPromo = true;
      }
    }

    return { price, isPromo };
  };

  const { price: displayPrice, isPromo } = getDisplayDetails();

  return (
    <Link href={`/tour/${tour.slug}`} className="bg-white rounded-2xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-all duration-300 flex flex-col relative">
       {isPromo && (
        <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Tag size={10} /> OFERTA
        </div>
      )}
      <div className="relative">
        <img src={tour.image} alt={tour.title[language]} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
        {tour.category && <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full capitalize shadow-md">{tour.category}</div>}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-serif text-xl font-bold text-gray-800 mb-2 truncate" title={tour.title[language]}>{tour.title[language]}</h3>
        <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden flex-grow line-clamp-2">{tour.description[language]}</p>
        <div className="flex justify-between items-end border-t pt-4 mt-auto">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t.tours.from || 'A partir de'}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold text-primary">{formatCurrency(displayPrice)}</p>
                {tour.pricingType === 'per_vehicle' && (
                    <span className="text-[10px] text-gray-400 font-medium uppercase">/ Veículo</span>
                )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-secondary bg-secondary/5 px-2 py-1 rounded-lg"><Star size={14} fill="currentColor" /> <span className="font-bold text-sm text-gray-700">{tour.rating ? tour.rating.toFixed(1) : '5.0'}</span></div>
        </div>
      </div>
    </Link>
  );
};

export default TourCard;