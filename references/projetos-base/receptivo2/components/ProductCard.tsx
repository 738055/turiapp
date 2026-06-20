'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, MapPin, Clock, Users, Luggage, Star, ArrowRight } from 'lucide-react';
import { Product } from '@/app/types';
import { calculateBasePrice, getRatingLabel, formatCurrency } from '@/app/lib/productUtils';
import { trackSelectItem } from '@/app/lib/tracking';

interface ProductCardProps {
  product: Product;
  layout?: 'horizontal' | 'vertical';
  isRoundtrip?: boolean;
  onBookTransfer?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'horizontal',
  isRoundtrip,
  onBookTransfer,
}) => {
  const router = useRouter();

  const isTransfer = product.type === 'transfer';
  const isPrivate = product.transferDetails?.serviceType === 'private';

  const basePrice = calculateBasePrice(product);
  const displayPrice = isRoundtrip ? basePrice * 2 : basePrice;

  const hasRating = product.rating != null;
  const ratingLabel = hasRating ? getRatingLabel(product.rating!) : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackSelectItem({ id: product.id, name: product.name, price: basePrice, type: product.type });
    if (isTransfer && onBookTransfer) {
      onBookTransfer(product);
    } else {
      router.push(`/tours/${product.slug}`);
    }
  };

  const firstRoute = product.transferDetails?.routes?.[0];
  const routeLabel = firstRoute
    ? `${firstRoute.originCode ?? firstRoute.originName} → ${firstRoute.destinationName}`
    : product.transferDetails?.airportCode
    ? `${product.transferDetails.airportCode} → ${product.transferDetails.city ?? 'Destino'}`
    : null;

  // ─── Micro-componentes reutilizados em ambos os layouts ───────────────────

  const CategoryTag = () => {
    const label = product.tags?.[0] ?? product.type;
    return (
      <span className="text-[11px] uppercase font-semibold text-primary-700 tracking-wide">
        {label}
      </span>
    );
  };

  const RatingBadge = () => {
    const displayRating = product.rating ?? 0;
    const displayCount = product.reviewsCount ?? 0;
    if (!hasRating) {
      return <span className="text-[13px] text-gray-400">Novo na agência</span>;
    }
    return (
      <div className="flex items-center gap-1.5 text-[13px]">
        <Star size={14} className="text-accent fill-accent" />
        <span className="font-semibold text-secondary">{displayRating.toFixed(1)}</span>
        {ratingLabel && <span className="text-gray-500">{ratingLabel}</span>}
        <span className="text-gray-400">
          {displayCount > 0 ? `(${displayCount})` : ''}
        </span>
      </div>
    );
  };

  const LocationLine = () => {
    const locationText = isTransfer
      ? (product.transferDetails?.city ?? null)
      : (product.location ?? null);
    if (!locationText) return null;
    return (
      <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
        <MapPin size={14} className="text-gray-400 shrink-0" />
        <span className="line-clamp-1">{locationText}</span>
      </div>
    );
  };

  const TypeDetails = () => (
    <div className="space-y-1.5">
      {isTransfer ? (
        <>
          {routeLabel && (
            <div className="flex items-center gap-1.5 text-[13px] text-gray-700 font-medium">
              <ArrowRight size={14} className="text-accent shrink-0" />
              <span className="line-clamp-1">{routeLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-[13px] text-gray-500">
            {product.transferDetails?.passengerCapacity && (
              <span className="flex items-center gap-1">
                <Users size={14} /> Até {product.transferDetails.passengerCapacity} pax
              </span>
            )}
            {product.transferDetails?.luggageCapacity != null && (
              <span className="flex items-center gap-1">
                <Luggage size={14} /> {product.transferDetails.luggageCapacity} malas
              </span>
            )}
          </div>
          <div className="text-[12px] text-primary-700 font-semibold uppercase tracking-wide">
            Transfer {isPrivate ? 'Privativo' : 'Compartilhado'}
          </div>
        </>
      ) : (
        <>
          {product.duration && (
            <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
              <Clock size={14} className="text-gray-400" /> {product.duration}
            </div>
          )}
          {product.guideLanguages && product.guideLanguages.length > 0 && (
            <div className="text-[13px] text-gray-500">
              <span className="text-gray-400">Idiomas:</span> {product.guideLanguages.join(', ')}
            </div>
          )}
          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {product.features.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  className="text-[12px] text-primary-800 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded flex items-center gap-1"
                >
                  <Check size={11} /> {f}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const Benefits = () =>
    product.is_free_cancellation ? (
      <div className="flex items-center gap-1.5 text-[13px] text-success font-medium">
        <Check size={15} strokeWidth={2.5} /> Cancelamento grátis
      </div>
    ) : null;

  const PricingBox = ({ isVertical }: { isVertical: boolean }) => (
    <div
      className={
        isVertical
          ? 'mt-auto p-4 border-t border-gray-100 flex flex-col items-start'
          : 'w-full sm:w-[240px] p-5 flex flex-col justify-center items-start shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100'
      }
    >
      <div className="mb-3">
        <span className="text-[11px] text-gray-500 font-medium block">
          {isTransfer
            ? `Total ${isRoundtrip ? '(ida e volta)' : 'a partir de'}`
            : 'Por pessoa, a partir de'}
        </span>

        <div className="flex items-baseline gap-2">
          {product.compareAtPrice && product.compareAtPrice > displayPrice && (
            <span className="text-[13px] text-gray-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
          <span className="text-2xl font-bold text-secondary leading-none">
            {formatCurrency(displayPrice)}
          </span>
        </div>

        <span className="text-[12px] text-gray-500 mt-0.5 block">ou 10x sem juros</span>
      </div>

      <button
        onClick={handleClick}
        className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>{isTransfer ? 'Reservar' : 'Ver detalhes'}</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  // ============================================================
  // LAYOUT VERTICAL (Home — Carrossel)
  // ============================================================
  if (layout === 'vertical') {
    return (
      <div
        onClick={handleClick}
        className="w-[280px] md:w-[300px] h-full flex flex-col bg-white rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer overflow-hidden"
      >
        {/* Imagem */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-gray-100 shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 280px, 300px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MapPin size={40} />
            </div>
          )}

          {product.is_free_cancellation && (
            <div className="absolute bottom-3 left-3 bg-white/95 text-success text-[11px] font-semibold px-2 py-1 rounded border border-gray-100 shadow-sm flex items-center gap-1">
              <Check size={12} strokeWidth={2.5} /> Cancelamento grátis
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <CategoryTag />
            <RatingBadge />
          </div>
          <h3 className="text-[15px] font-bold text-secondary line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="space-y-2">
            <LocationLine />
            <TypeDetails />
          </div>
        </div>

        <PricingBox isVertical={true} />
      </div>
    );
  }

  // ============================================================
  // LAYOUT HORIZONTAL (Busca / Lista)
  // ============================================================
  return (
    <div
      onClick={handleClick}
      className="flex flex-col sm:flex-row bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
    >
      {/* Imagem */}
      <div className="relative w-full sm:w-[280px] h-56 sm:h-auto shrink-0 overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <MapPin size={40} />
          </div>
        )}

        {product.is_free_cancellation && (
          <div className="absolute bottom-3 left-3 bg-white/95 text-success text-[11px] font-semibold px-2 py-1 rounded border border-gray-100 shadow-sm flex items-center gap-1">
            <Check size={12} strokeWidth={2.5} /> Cancelamento grátis
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 p-5 flex flex-col justify-start">
        <div className="flex items-center gap-3 mb-1.5">
          <CategoryTag />
          <span className="text-gray-300">·</span>
          <RatingBadge />
        </div>
        <h3 className="text-lg font-bold text-secondary line-clamp-2 mb-3 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="space-y-2.5 max-w-lg">
          <LocationLine />
          <TypeDetails />
          <Benefits />
        </div>
      </div>

      <PricingBox isVertical={false} />
    </div>
  );
};
