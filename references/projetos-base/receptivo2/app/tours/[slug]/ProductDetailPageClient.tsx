'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Star, MapPin, Clock, Calendar, Users, Check, Map as MapIcon,
  Coffee, Camera, Bus, Plus, Minus, ArrowRight, ShoppingBag, AlertCircle, X, ShieldCheck, Tag,
  ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useCart } from '@/app/contexts/CartContext';
import { Product } from '@/app/types';
import { trackViewItem, trackAddToCart, trackBeginCheckout } from '@/app/lib/tracking';
import { formatCurrency } from '@/app/lib/productUtils';

// Interface das props que vêm do Server Component (Banco de Dados)
interface ProductDetailPageClientProps {
  product: Product;
}

export const ProductDetailPageClient: React.FC<ProductDetailPageClientProps> = ({ product }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart } = useCart();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Unifica a foto principal (capa) com a galeria num único array
  const allImages = [product.imageUrl, ...(product.gallery || [])].filter(Boolean);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  
  // Estados para seleção do usuário
  const [selectedDate, setSelectedDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});

  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>(() => {
      const initial: Record<string, number> = {};
      if (product.pricingTiers && product.pricingTiers.length > 0) {
          initial[product.pricingTiers[0].id] = 1;
      }
      return initial;
  });

  // Dispara view_item ao montar a página (GA4 + Meta Pixel)
  useEffect(() => {
    trackViewItem({ id: product.id, name: product.name, price: product.price, type: product.type });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleTierChange = (id: string, qty: number) => {
     setSelectedTiers(prev => ({...prev, [id]: qty}));
  };

  const handleExtraChange = (idOrName: string, qty: number) => {
     setSelectedExtras(prev => ({...prev, [idOrName]: qty}));
  };

  const calculateTotal = () => {
     let base = 0;
     if (product.pricingTiers && product.pricingTiers.length > 0) {
         product.pricingTiers.forEach(t => {
             base += (selectedTiers[t.id] || 0) * t.price;
         });
     } else {
         base = (adults * product.price) + (children * (product.price * 0.7));
     }

     let extrasTotal = 0;
     if (product.extras && Array.isArray(product.extras)) {
        product.extras.forEach(ex => {
           const key = ex.id || ex.name;
           extrasTotal += (selectedExtras[key] || 0) * ex.price;
        });
     }
     return base + extrasTotal;
  };

  const handleAddToCart = () => {
    if (!selectedDate) return alert("Por favor, selecione uma data para o passeio.");
    const total = calculateTotal();
    addToCart(product, selectedDate, adults, children, selectedExtras, undefined, selectedTiers);
    trackAddToCart(
      { id: product.id, name: product.name, price: product.price, type: product.type, quantity: adults + children },
      total
    );
  };

  const handleBuyNow = () => {
    if (!selectedDate) return alert("Por favor, selecione uma data para o passeio.");
    const total = calculateTotal();
    addToCart(product, selectedDate, adults, children, selectedExtras, undefined, selectedTiers);
    trackBeginCheckout(total, [
      { id: product.id, name: product.name, price: product.price, type: product.type, quantity: adults + children },
    ]);
    router.push('/checkout');
  };

  const getIcon = (type?: string) => {
     switch(type) {
        case 'food': return <Coffee size={16} />;
        case 'camera': return <Camera size={16} />;
        case 'bus': return <Bus size={16} />;
        default: return <MapIcon size={16} />;
     }
  };

  return (
    <PublicLayout>
      {/* Breadcrumb / Navegação */}
      <div className="bg-white border-b border-gray-100 py-4 text-sm text-gray-500">
        <div className="container mx-auto px-4 flex items-center gap-2">
           <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/')}>Home</span> 
           <ArrowRight size={12}/> 
           <span className="hover:text-primary cursor-pointer">{product.category || 'Passeios'}</span> 
           <ArrowRight size={12}/> 
           <span className="text-gray-800 font-medium truncate max-w-[200px] md:max-w-none">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Coluna Esquerda: Detalhes, Fotos e Info */}
          <div className="lg:w-2/3">
            {/* TAGS DO WIZARD */}
            {product.tags && product.tags.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-3">
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className="bg-primary-50 text-primary-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Tag size={10}/> {tag}
                    </span>
                  ))}
               </div>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              {product.location && (
                <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 text-primary font-medium">
                  <MapPin size={14} className="text-primary"/> {product.location}
                </span>
              )}
              {product.duration && (
                <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 text-primary font-medium">
                  <Clock size={14} className="text-primary"/> {product.duration}
                </span>
              )}
              {(() => {
                const displayRating = product.rating ?? 0;
                const displayCount = product.reviewsCount ?? 0;
                const fullStars = Math.floor(displayRating / 2);
                const hasHalfStar = (displayRating / 2) % 1 >= 0.5;
                return (
                  <span className="flex items-center gap-1.5 ml-2">
                    <span className="bg-secondary text-white font-semibold text-sm px-2 py-0.5 rounded">
                      {displayRating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < fullStars
                              ? 'text-accent fill-accent'
                              : i === fullStars && hasHalfStar
                              ? 'text-accent fill-accent/50'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </span>
                    <span className="text-gray-500 font-normal text-sm">
                      {displayCount > 0 ? `(${displayCount} avaliações)` : 'Sem avaliações'}
                    </span>
                  </span>
                );
              })()}
            </div>

            {/* Grid de Imagens Estilo Airbnb/Decolar */}
            <div className="mb-8 relative max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] relative">
                
                {/* Imagem Principal (Ocupa 2 colunas no Desktop) — priority para LCP */}
                <div
                  className="md:col-span-2 h-full cursor-pointer relative group"
                  onClick={() => openLightbox(0)}
                >
                  <Image
                    src={allImages[0]}
                    alt={product.name || 'Produto'}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:brightness-90 transition-all duration-300"
                  />
                </div>
                
                {/* Imagens Secundárias (Visíveis apenas em telas maiores) */}
                <div className="hidden md:flex flex-col gap-2 h-full">
                  {allImages[1] && (
                     <div className="relative h-[calc(50%-0.25rem)] w-full cursor-pointer hover:brightness-90 transition-all duration-300" onClick={() => openLightbox(1)}>
                       <Image src={allImages[1]} alt={`${product.name} - foto 2`} fill sizes="25vw" className="object-cover" />
                     </div>
                  )}
                  {allImages[2] && (
                     <div className="relative h-[calc(50%-0.25rem)] w-full cursor-pointer hover:brightness-90 transition-all duration-300" onClick={() => openLightbox(2)}>
                       <Image src={allImages[2]} alt={`${product.name} - foto 3`} fill sizes="25vw" className="object-cover" />
                     </div>
                  )}
                </div>

                <div className="hidden md:flex flex-col gap-2 h-full relative">
                  {allImages[3] && (
                     <div className="relative h-[calc(50%-0.25rem)] w-full cursor-pointer hover:brightness-90 transition-all duration-300" onClick={() => openLightbox(3)}>
                       <Image src={allImages[3]} alt={`${product.name} - foto 4`} fill sizes="25vw" className="object-cover" />
                     </div>
                  )}
                  {allImages[4] && (
                     <div className="relative h-[calc(50%-0.25rem)] w-full cursor-pointer hover:brightness-90 transition-all duration-300" onClick={() => openLightbox(4)}>
                       <Image src={allImages[4]} alt={`${product.name} - foto 5`} fill sizes="25vw" className="object-cover" />
                     </div>
                  )}

                  {/* Botão Ver Todas as Fotos */}
                  {allImages.length > 5 && (
                    <button 
                      onClick={() => openLightbox(0)}
                      className="absolute bottom-4 right-4 bg-white/95 text-gray-900 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-white hover:scale-105 transition-all"
                    >
                      <ImageIcon size={18} />
                      Ver todas as {allImages.length} fotos
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
               <div className="p-8 border-b border-gray-100">
                   <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <MapIcon className="text-primary"/> Informação Geral
                   </h2>
                   <div className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                   </div>
               </div>
               
               {/* DETALHES DE TRANSFER (SE EXISTIR) */}
               {product.type === 'transfer' && product.transferDetails && (
                 <div className="p-8 border-b border-gray-100 bg-primary-50/30">
                     <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                        <Bus className="text-primary-600"/> Detalhes do Transfer
                     </h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {product.transferDetails.serviceType && (
                           <div><strong className="block text-gray-500">Tipo:</strong> {product.transferDetails.serviceType === 'private' ? 'Privativo' : 'Compartilhado'}</div>
                        )}
                        {product.transferDetails.passengerCapacity && (
                           <div><strong className="block text-gray-500">Capacidade:</strong> Até {product.transferDetails.passengerCapacity} pax</div>
                        )}
                        {product.transferDetails.vehicleModel && (
                           <div><strong className="block text-gray-500">Veículo:</strong> {product.transferDetails.vehicleModel}</div>
                        )}
                        {product.transferDetails.luggageCapacity && (
                           <div><strong className="block text-gray-500">Bagagem:</strong> {product.transferDetails.luggageCapacity} malas</div>
                        )}
                     </div>
                 </div>
               )}

               {(product.features?.length || product.notIncluded?.length) ? (
                 <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                     <h2 className="text-xl font-bold mb-6 text-gray-800">O que inclui / Não inclui</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {product.features && product.features.length > 0 && (
                           <div>
                             <ul className="space-y-3">
                                {product.features.map((feat, i) => (
                                  <li key={i} className="flex items-start gap-3 text-gray-800 font-medium">
                                    <Check size={20} className="text-success mt-0.5 shrink-0" strokeWidth={3} />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                             </ul>
                           </div>
                         )}
                         {product.notIncluded && product.notIncluded.length > 0 && (
                           <div>
                             <ul className="space-y-3">
                                {product.notIncluded.map((item, i) => (
                                  <li key={i} className="flex items-start gap-3 text-gray-500">
                                    <X size={20} className="text-red-400 mt-0.5 shrink-0" strokeWidth={3} />
                                    <span>{item}</span>
                                  </li>
                                ))}
                             </ul>
                           </div>
                         )}
                     </div>
                 </div>
               ) : null}

               {product.importantInfo && (
                 <div className="p-8 border-b border-gray-100">
                     <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                        <AlertCircle className="text-accent"/> Antes de participar
                     </h2>
                     <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line bg-accent-50 p-4 rounded-xl border border-accent-100">
                        {product.importantInfo}
                     </div>
                 </div>
               )}

               {product.cancellationPolicy && (
                 <div className="p-8">
                     <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="text-success"/> Política de cancelamento
                     </h2>
                     <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                        {product.cancellationPolicy}
                     </div>
                 </div>
               )}
            </div>

            {product.itinerary && product.itinerary.length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                 <h2 className="text-2xl font-bold mb-8 border-b border-gray-100 pb-4 text-gray-800">{t('itinerary')}</h2>
                 <div className="relative border-l-2 border-primary/20 ml-3 space-y-10 pb-2">
                    {product.itinerary.map((item, idx) => (
                      <div key={idx} className="ml-8 relative">
                        <span className="absolute -left-[43px] top-0 bg-white border-4 border-primary/20 text-primary rounded-full p-2 shadow-sm">
                           {getIcon(item.icon)}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                           {item.time && <span className="font-mono text-xs font-bold bg-secondary text-white px-2 py-1 rounded">{item.time}</span>}
                           <h4 className="font-bold text-gray-800 text-lg">{item.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Card de Compra */}
          <div className="lg:w-1/3">
             <div className="sticky top-24 z-30">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                   <div className="bg-secondary p-5 text-white flex justify-between items-center relative">
                      {/* Lógica do Compare At Price (Preço cortado) */}
                      <div>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                           <p className="text-sm text-white/70 line-through mb-1">{formatCurrency(product.compareAtPrice)}</p>
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                           {product.compareAtPrice ? 'Por apenas' : 'A partir de'}
                        </p>
                        <div className="text-3xl font-bold">
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                      
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="text-right">
                           <div className="bg-urgent text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="p-6">
                      <div className="space-y-5">
                         {/* Seletor de Data */}
                         <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-2"><Calendar size={14}/> {t('date')}</label>
                            <input 
                              type="date" 
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-gray-50"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                            />
                            {!selectedDate && <p className="text-xs text-urgent mt-2 flex items-center gap-1"><AlertCircle size={10}/> Data obrigatória</p>}
                         </div>

                         {/* Passageiros / Veículos — agrupados por modo */}
                         <div className="space-y-4">
                            {(() => {
                              const tiers = product.pricingTiers || [];
                              const regularTiers = tiers.filter(t => !t.mode || t.mode === 'per_person');
                              const vehicleTiers = tiers.filter(t => t.mode === 'per_vehicle');
                              const hasRegular = regularTiers.length > 0;
                              const hasVehicle = vehicleTiers.length > 0;
                              const hasBoth = hasRegular && hasVehicle;
                              const hasAny = hasRegular || hasVehicle;

                              if (!hasAny) {
                                // Fallback: sem tiers — exibe adulto/criança genérico
                                return (
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-2"><Users size={14}/> Ingressos / Passageiros</label>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                        <div>
                                          <span className="block text-sm font-bold text-gray-800">{t('adults')}</span>
                                          <span className="text-xs text-primary font-bold">{formatCurrency(product.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Minus size={14}/></button>
                                          <span className="w-4 text-center font-bold">{adults}</span>
                                          <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Plus size={14}/></button>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                        <div>
                                          <span className="block text-sm font-bold text-gray-800">{t('children')}</span>
                                          <span className="text-xs text-primary font-bold">{formatCurrency(product.price * 0.7)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Minus size={14}/></button>
                                          <span className="w-4 text-center font-bold">{children}</span>
                                          <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Plus size={14}/></button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const renderTierList = (tierList: typeof tiers) => (
                                <div className="space-y-2">
                                  {tierList.map(tier => (
                                    <div key={tier.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                      <div>
                                        <span className="block text-sm font-bold text-gray-800">{tier.name}</span>
                                        <span className="text-xs text-primary font-bold">{formatCurrency(tier.price)}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button onClick={() => handleTierChange(tier.id, Math.max(0, (selectedTiers[tier.id] || 0) - 1))} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Minus size={14}/></button>
                                        <span className="w-4 text-center font-bold">{selectedTiers[tier.id] || 0}</span>
                                        <button onClick={() => handleTierChange(tier.id, (selectedTiers[tier.id] || 0) + 1)} className="w-8 h-8 rounded-full bg-white border hover:border-primary hover:text-primary flex items-center justify-center font-bold transition-colors shadow-sm"><Plus size={14}/></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );

                              return (
                                <>
                                  {hasRegular && (
                                    <div>
                                      <div className={`flex items-center gap-2 mb-2 ${hasBoth ? 'pb-1 border-b border-primary-100' : ''}`}>
                                        <Users size={14} className="text-primary" />
                                        <label className="text-xs font-bold text-primary-dark uppercase tracking-wide">
                                          {hasBoth ? 'Regular — Por Pessoa' : 'Ingressos / Passageiros'}
                                        </label>
                                      </div>
                                      {renderTierList(regularTiers)}
                                    </div>
                                  )}

                                  {hasBoth && (
                                    <div className="flex items-center gap-3 py-1">
                                      <div className="flex-1 h-px bg-gray-200" />
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ou</span>
                                      <div className="flex-1 h-px bg-gray-200" />
                                    </div>
                                  )}

                                  {hasVehicle && (
                                    <div>
                                      <div className={`flex items-center gap-2 mb-2 ${hasBoth ? 'pb-1 border-b border-primary-100' : ''}`}>
                                        <ShoppingBag size={14} className="text-primary-600" />
                                        <label className="text-xs font-bold text-primary-700 uppercase tracking-wide">
                                          {hasBoth ? 'Privativo — Por Veículo' : 'Selecione o Veículo'}
                                        </label>
                                      </div>
                                      {renderTierList(vehicleTiers)}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                         </div>
                        
                        {/* Extras (Renderiza dinamicamente do objeto product) */}
                        {product.extras && product.extras.length > 0 && (
                          <div className="border-t pt-4">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-2"><Plus size={14}/> Extras Opcionais</label>
                            {product.extras.map((extra, idx) => {
                               const key = extra.id || extra.name;
                               return (
                                <div key={idx} className="flex justify-between items-center mb-2 text-sm">
                                  <span>{extra.name} (+{formatCurrency(Number(extra.price))})</span>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => handleExtraChange(key, Math.max(0, (selectedExtras[key] || 0) - 1))} className="w-6 h-6 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button>
                                     <span className="w-4 text-center">{selectedExtras[key] || 0}</span>
                                     <button onClick={() => handleExtraChange(key, (selectedExtras[key] || 0) + 1)} className="w-6 h-6 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100">+</button>
                                  </div>
                                </div>
                               );
                            })}
                          </div>
                        )}

                      </div>

                      <div className="mt-6 border-t pt-4">
                         <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-gray-700">{t('total')}</span>
                            <div className="text-right">
                              <span className="block text-2xl font-bold text-secondary">{formatCurrency(calculateTotal())}</span>
                              <span className="text-[11px] text-gray-500">ou em até 6x no cartão</span>
                            </div>
                         </div>

                         <div className="flex gap-2">
                           <button onClick={handleAddToCart} className="flex-1 bg-white border border-primary text-primary font-semibold py-3 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
                              <ShoppingBag size={18}/> Adicionar
                           </button>
                           <button onClick={handleBuyNow} className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                              Comprar
                           </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      {/* Modal Lightbox (Tela Cheia) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          {/* Botão Fechar */}
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-all z-10"
          >
            <X size={28} />
          </button>
          
          {/* Navegação - Anterior */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 sm:p-4 rounded-full transition-all z-10"
          >
            <ChevronLeft size={32} />
          </button>
          
          {/* Navegação - Próxima */}
          <button 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 sm:p-4 rounded-full transition-all z-10"
          >
            <ChevronRight size={32} />
          </button>

          {/* Imagem Ampliada */}
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center relative">
            <div className="relative w-full" style={{ height: '85vh' }}>
              <Image
                src={allImages[currentImageIndex]}
                alt={`${product.name} - foto ${currentImageIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain select-none shadow-2xl rounded-lg"
              />
            </div>
            <div className="text-white/80 mt-4 text-sm font-medium tracking-widest">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};