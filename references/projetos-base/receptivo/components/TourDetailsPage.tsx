'use client';

import React, { useState, useEffect } from 'react';
import { Tour, VehicleTier } from '../types';
import { 
  Clock, MapPin, Check, X, Calendar, User, Star, ArrowLeft, 
  ShoppingCart, MessageCircle, ShieldCheck, Info, Car, CreditCard, Tag, Camera, Share2, Map as MapIcon
} from 'lucide-react';
import Button from './Button';
import JsonLd from './JsonLd';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'next/navigation';
// Importamos a função de rastreamento
import { trackEvent } from '@/utils/analytics'; 

interface TourDetailsPageProps {
  tour: Tour;
}

const TourDetailsPage: React.FC<TourDetailsPageProps> = ({ tour }) => {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('2');
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- LÓGICA DE PREÇO (ATUALIZADA PARA TIERS COM PROMOÇÃO) ---
  const calculatePrice = () => {
    const paxCount = parseInt(guests, 10) || 1;
    
    let unitPrice = 0;          // Preço final a ser cobrado (por pessoa ou por veículo)
    let originalUnitPrice = 0;  // Preço original (para mostrar o "De R$...")
    let isPromo = false;        // Se deve mostrar tag de oferta
    let activeTier: VehicleTier | undefined;
    let isSeasonal = false;

    // 1. Determinar Preço Base e Tier (Se houver)
    if (tour.pricingType === 'per_vehicle' && tour.vehicleTiers) {
        // Encontrar o Tier adequado para a quantidade de pessoas
        activeTier = tour.vehicleTiers.find(t => paxCount >= t.minPax && paxCount <= t.maxPax);
        
        if (activeTier) {
            originalUnitPrice = activeTier.price;
            
            // Verifica Promoção no Tier
            if (activeTier.promotionalPrice && activeTier.promotionalPrice > 0 && activeTier.promotionalPrice < activeTier.price) {
                unitPrice = activeTier.promotionalPrice;
                isPromo = true;
            } else {
                unitPrice = activeTier.price;
            }
        } else {
            // Fallback se nenhum tier for encontrado (ex: excedeu capacidade)
            unitPrice = tour.basePrice;
            originalUnitPrice = tour.basePrice;
        }
    } else {
        // Preço por Pessoa
        originalUnitPrice = tour.basePrice;
        
        if (tour.pricePromotional && tour.pricePromotional > 0 && tour.pricePromotional < tour.basePrice) {
            unitPrice = tour.pricePromotional;
            isPromo = true;
        } else {
            unitPrice = tour.basePrice;
        }
    }

    // 2. Verificar Sazonalidade (Data Específica)
    // Regras de data geralmente sobrescrevem promoções padrão
    if (tour.seasonalRules && tour.seasonalRules.length > 0 && date) {
      const selectedDate = new Date(date);
      // Zera hora para comparação justa
      selectedDate.setHours(12,0,0,0);
      
      const rule = tour.seasonalRules.find(r => {
        // Ajuste de fuso simples adicionando horas
        const start = new Date(r.startDate + 'T12:00:00');
        const end = new Date(r.endDate + 'T12:00:00');
        return selectedDate >= start && selectedDate <= end;
      });

      if (rule) {
        isSeasonal = true;
        isPromo = false; // Sazonalidade esconde a flag de promo padrão para evitar confusão
        
        if (rule.type === 'fixed') {
            unitPrice = rule.price;
            originalUnitPrice = rule.price; // Oculta o "De/Por" se for preço fixo de temporada
        } else {
            // Regra percentual (ex: +20% no feriado)
            const increase = unitPrice * (rule.price / 100);
            unitPrice = unitPrice + increase;
            originalUnitPrice = unitPrice; 
        }
      }
    }

    // 3. Calcular Total Final
    let finalTotal = 0;
    if (tour.pricingType === 'per_person') {
      finalTotal = unitPrice * paxCount;
    } else {
      finalTotal = unitPrice; // Por veículo o preço é único pelo Tier
    }

    return { 
        total: finalTotal, 
        unit: unitPrice, 
        originalUnit: originalUnitPrice,
        isSeasonal, 
        isPromo, 
        activeTier 
    };
  };

  const priceData = calculatePrice();
  const currentPrice = priceData.total;
  
  // Flag para exibir o bloco de Promoção na UI
  // Mostra se: (É promo detectada E não é data sazonal)
  const showPromoDisplay = priceData.isPromo && !priceData.isSeasonal;

  // --- EFEITOS (TRACKING E SCROLL) ---
  useEffect(() => { 
    window.scrollTo(0, 0); 
    
    // Dispara o evento ViewContent (Visualização de Conteúdo/Produto)
    trackEvent('ViewContent', {
      currency: 'BRL',
      value: tour.basePrice,
      items: [{
        item_id: tour.id,
        item_name: tour.title?.pt || tour.title?.[language], // Garante nome consistente
        item_category: tour.category || 'Tour',
        price: tour.basePrice,
        quantity: 1
      }]
    });
  }, [tour, language]);

  const handleWhatsAppBooking = () => {
    const orderId = Math.floor(Math.random() * 100000);
    const paxCount = parseInt(guests, 10) || 1;

    // Rastreamento de Conversão (Purchase) para o clique direto no WhatsApp.
    // Isso unifica a conversão, seja vindo do carrinho ou de um clique direto.
    trackEvent('Purchase', {
      value: currentPrice,
      currency: 'BRL',
      transaction_id: `ORDER_${orderId}`,
      // Este Label conecta o evento à ação de conversão "Compra" no Google Ads
      gAdsConversionLabel: 'AW-17952330633/ZhvwCNGFy_gbEImnq_BC',
      items: [{
        item_id: tour.id,
        item_name: tour.title[language],
        price: priceData.unit, // Usar o preço unitário calculado
        quantity: tour.pricingType === 'per_person' ? paxCount : 1,
      }]
    });

    const tierInfo = priceData.activeTier ? `(Veículo: ${priceData.activeTier.vehicleName})` : '';
    const message = `*Olá! Gostaria de reservar:* %0A%0A🏞️ *${tour.title[language]}*%0A📅 Data: ${date || 'A definir'}%0A👥 Pessoas: ${guests} ${tierInfo}%0A💰 Valor Estimado: R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    // Pequeno delay para garantir que o pixel dispare antes de mudar de aba
    setTimeout(() => {
        window.open(`https://wa.me/5545991083852?text=${message}`, '_blank');
    }, 300);
  };

  const handleAddToCart = () => {
    if (!date) {
        alert(t.details.checkAvailability || "Por favor selecione uma data.");
        return;
    }
    
    // Rastreia adição ao carrinho
    trackEvent('AddToCart', {
      currency: 'BRL',
      value: currentPrice,
      items: [{
        item_id: tour.id,
        item_name: tour.title[language],
        item_category: tour.category,
        price: priceData.unit,
        quantity: parseInt(guests, 10) || 1
      }]
    });

    addToCart({
      tourId: tour.id,
      tourTitle: tour.title[language],
      date: date,
      guests: parseInt(guests, 10) || 1,
      price: currentPrice,
      pricingType: tour.pricingType,
      selectedTierName: priceData.activeTier?.vehicleName // Salva qual veículo foi escolhido
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen animate-fade-in pb-20 font-sans">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": tour.title[language],
        "description": tour.description[language],
        "image": tour.image,
        "offers": { "@type": "Offer", "priceCurrency": "BRL", "price": currentPrice }
      }} />
      
      {/* --- HERO BANNER (Imersivo) --- */}
      <div className="relative h-[65vh] md:h-[75vh] w-full group overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
            src={tour.image} 
            alt={tour.title[language]} 
            className="w-full h-full object-cover transform transition-transform duration-[3s] group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 opacity-90"></div>
        
        {/* Navbar Flutuante Back */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 z-30 flex justify-between items-center">
           <button onClick={() => router.back()} className="flex items-center text-white bg-black/20 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full hover:bg-black/40 transition-all group/btn">
             <ArrowLeft size={18} className="mr-2 group-hover/btn:-translate-x-1 transition-transform" />
             <span className="font-bold text-sm tracking-wide">{t.details.back}</span>
           </button>
           
           <div className="flex gap-3">
               <button className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all border border-white/10">
                   <Share2 size={18} />
               </button>
           </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white container mx-auto z-20">
          <div className="animate-slide-up max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg border border-white/10">
                    {tour.category || 'Experiência'}
                </span>
                {tour.featured && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> Destaque
                    </span>
                )}
                {/* Badge de Oferta também no Hero se for Promo */}
                {showPromoDisplay && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1 animate-pulse">
                        <Tag size={12} fill="currentColor" /> Oferta Especial
                    </span>
                )}
              </div>
              
              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-2xl">
                  {tour.title[language]}
              </h1>
              
              <div className="flex flex-wrap gap-4 md:gap-6 text-sm font-medium text-gray-100">
                {tour.location && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <MapPin size={18} className="text-secondary"/>
                        <span>{tour.location[language]}</span>
                    </div>
                )}
                {tour.duration && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <Clock size={18} className="text-secondary"/>
                        <span>{tour.duration[language]}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                      <Star size={18} className="text-yellow-400" fill="currentColor"/>
                      <span>5.0 <span className="text-gray-300 hidden sm:inline">(Avaliações)</span></span>
                </div>
              </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- COLUNA ESQUERDA (Conteúdo) --- */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Galeria Grid (Mini) */}
             {tour.gallery && tour.gallery.length > 0 && (
                <div className="bg-white p-4 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 hidden md:block">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Camera size={16} className="text-primary"/>
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Galeria de Fotos</span>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                        {tour.gallery.slice(0, 6).map((img, i) => (
                            <div 
                                key={i} 
                                className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group ring-2 ring-transparent hover:ring-primary transition-all" 
                                onClick={() => setSelectedImage(img)}
                            >
                                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* Descrição e Highlights */}
             <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                 <h3 className="font-serif text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                     <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                     Sobre a Experiência
                 </h3>
                 <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed prose-headings:font-serif prose-headings:text-primary prose-a:text-secondary" 
                      dangerouslySetInnerHTML={{ __html: tour.fullDescription[language] || tour.description[language] }} />
                 
                 {/* Badges de Confiança */}
                 <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {[
                         { icon: ShieldCheck, text: 'Seguro Incluso', color: 'text-green-600', bg: 'bg-green-50' },
                         { icon: User, text: 'Guia Especializado', color: 'text-blue-600', bg: 'bg-blue-50' },
                         { icon: Check, text: 'Cancelamento Grátis', color: 'text-purple-600', bg: 'bg-purple-50' }
                     ].map((item, i) => (
                         <div key={i} className={`flex items-center gap-3 p-4 rounded-xl ${item.bg} border border-transparent hover:border-gray-200 transition-all`}>
                             <item.icon className={item.color} size={20} />
                             <span className="text-sm font-bold text-gray-700">{item.text}</span>
                         </div>
                     ))}
                 </div>
             </div>
             
             {/* INCLUSOS & NÃO INCLUSOS */}
             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-lg shadow-green-100/50 border border-green-50 relative overflow-hidden group hover:border-green-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -mr-8 -mt-8 z-0"></div>
                    
                    <h4 className="font-bold mb-6 flex items-center gap-3 text-gray-800 text-lg relative z-10">
                        <div className="bg-green-100 p-2.5 rounded-xl text-green-700 shadow-sm"><Check size={20}/></div>
                        O que Inclui
                    </h4>
                    
                    {tour.included?.[language]?.length > 0 ? (
                        <ul className="space-y-4 relative z-10">
                            {tour.included[language].filter(Boolean).map((item, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 group/item">
                                    <div className="min-w-[6px] h-[6px] rounded-full bg-green-400 mt-2 group-hover/item:scale-125 transition-transform"></div>
                                    <span className="leading-relaxed font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <span className="text-gray-400 italic text-sm">Informação indisponível</span>}
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-lg shadow-red-100/50 border border-red-50 relative overflow-hidden group hover:border-red-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[100px] -mr-8 -mt-8 z-0"></div>

                    <h4 className="font-bold mb-6 flex items-center gap-3 text-gray-800 text-lg relative z-10">
                         <div className="bg-red-100 p-2.5 rounded-xl text-red-600 shadow-sm"><X size={20}/></div>
                         O que Não Inclui
                    </h4>
                    
                    {tour.notIncluded?.[language]?.length > 0 ? (
                        <ul className="space-y-4 relative z-10">
                            {tour.notIncluded[language].filter(Boolean).map((item, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 group/item">
                                    <div className="min-w-[6px] h-[6px] rounded-full bg-red-300 mt-2 group-hover/item:scale-125 transition-transform"></div>
                                    <span className="leading-relaxed font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <span className="text-gray-400 italic text-sm">Informação indisponível</span>}
                </div>
             </div>

             {/* ROTEIRO INTERATIVO (Timeline) */}
             {tour.itinerary && tour.itinerary.length > 0 && (
                <div className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                    <h3 className="font-serif text-2xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                        <MapIcon className="text-secondary"/>
                        Roteiro da Experiência
                    </h3>
                    
                    <div className="relative pl-4 space-y-0">
                        {/* Linha do tempo */}
                        <div className="absolute left-[27px] top-4 bottom-8 w-[2px] bg-gradient-to-b from-gray-200 via-gray-200 to-transparent"></div>

                        {tour.itinerary.map((item, i) => (
                            <div key={i} className="relative pl-12 pb-12 group last:pb-0">
                                {/* Bolinha da Timeline */}
                                <div className="absolute left-[18px] top-0 w-5 h-5 rounded-full bg-white border-4 border-gray-300 z-10 group-hover:border-secondary group-hover:scale-110 transition-all shadow-sm"></div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                    <span className="inline-flex items-center justify-center bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md w-fit">
                                        <Clock size={12} className="mr-1"/> {item.time}
                                    </span>
                                </div>
                                
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-md group-hover:border-gray-200 transition-all">
                                    <p className="text-gray-700 font-medium leading-relaxed">
                                        {item.activity[language]}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>

          {/* --- COLUNA DIREITA (Sidebar Sticky) --- */}
          <div className="lg:col-span-1">
             <div className="sticky top-24 space-y-4">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden relative">
                    {/* Efeito de Fundo */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    {/* HEADER DE PREÇO DINÂMICO */}
                    <div className="relative z-10 border-b border-gray-100 pb-6 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <p className="text-xs text-green-600 uppercase tracking-widest font-bold">
                                Disponível Agora
                            </p>
                        </div>
                        
                        <div className="flex flex-col">
                            {/* PREÇO PROMOCIONAL (De / Por) */}
                            {showPromoDisplay ? (
                                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 mb-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Oferta</span>
                                        <span className="text-gray-400 line-through text-sm font-medium">
                                            De {formatCurrency(priceData.originalUnit)}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm text-gray-500 font-bold uppercase mt-2">Por</span>
                                        <span className="text-red-600 font-serif font-bold text-5xl tracking-tighter leading-none">
                                            {formatCurrency(priceData.unit)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                                        {tour.pricingType === 'per_person' ? 'Por Pessoa:' : 'Valor Total:'}
                                    </span>
                                    <span className="text-primary font-serif font-bold text-5xl tracking-tighter leading-none">
                                        {formatCurrency(priceData.unit)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* DETALHES DE PARCELAMENTO */}
                        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                             <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-secondary"/>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700 uppercase">Cartão de Crédito</span>
                                    <span className="text-[10px] text-gray-500">{t.details.installments || 'Em até 10x Sem Juros'}</span>
                                </div>
                             </div>
                             {showPromoDisplay && <Tag size={16} className="text-red-400"/>}
                        </div>
                        
                        {/* Se for Por Veículo - Mostra a Tier Ativa */}
                        {tour.pricingType === 'per_vehicle' && tour.vehicleTiers && (
                            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <p className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1 mb-2">
                                    <Car size={12}/> Opções de Veículo:
                                </p>
                                <div className="space-y-1.5">
                                    {tour.vehicleTiers.map(tier => {
                                        const isActive = priceData.activeTier?.id === tier.id;
                                        return (
                                            <div 
                                                key={tier.id} 
                                                className={`flex justify-between items-center text-xs p-2 rounded-lg border transition-all ${
                                                    isActive 
                                                    ? 'bg-white border-blue-200 text-blue-700 font-bold shadow-sm' 
                                                    : 'border-transparent text-gray-500'
                                                }`}
                                            >
                                                <span>{tier.vehicleName} (até {tier.maxPax} pax)</span>
                                                <div className="text-right">
                                                    {tier.promotionalPrice && tier.promotionalPrice > 0 ? (
                                                        <span className="text-green-600 font-bold">{formatCurrency(tier.promotionalPrice)}</span>
                                                    ) : (
                                                        <span>{formatCurrency(tier.price)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {!priceData.activeTier && (
                                    <p className="text-[10px] text-red-500 mt-2 font-bold text-center">
                                        Número de passageiros excede a capacidade dos veículos.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FORMULÁRIO */}
                    <div className="space-y-4 mb-6 relative z-10">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Data da Viagem</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 text-gray-400 group-hover:text-primary transition-colors" size={18} />
                                    <input 
                                        type="date" 
                                        className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-primary transition-all font-bold text-gray-700 cursor-pointer text-sm" 
                                        value={date} 
                                        onChange={(e) => setDate(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Passageiros</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-gray-400 group-hover:text-primary transition-colors" size={18} />
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-primary transition-all font-bold text-gray-700 text-sm" 
                                        value={guests} 
                                        onChange={(e) => setGuests(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>

                         {/* MENSAGEM DE DISPONIBILIDADE SE DATA VAZIA */}
                         {!date && (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2 animate-pulse">
                                <Info size={16} className="text-amber-500 mt-0.5 shrink-0"/> 
                                <span className="text-xs font-medium text-amber-700 leading-tight">
                                    {t.details.checkAvailability || "Selecione uma data para verificar a disponibilidade."}
                                </span>
                            </div>
                         )}
                    </div>

                    {/* BOTÕES ALINHADOS E MELHORADOS */}
                    <div className="flex flex-col gap-3 pt-2 relative z-10">
                        {/* Botão WhatsApp */}
                        <Button 
                            onClick={handleWhatsAppBooking} 
                            fullWidth 
                            className="h-14 bg-[#25D366] hover:bg-[#128C7E] text-white border-none rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all transform hover:-translate-y-0.5"
                        >
                            <MessageCircle size={22} fill="white" className="text-white" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase opacity-90 font-medium">Falar com Consultor</span>
                                <span>Reservar no WhatsApp</span>
                            </div>
                        </Button>
                        
                        {/* Botão Adicionar ao Carrinho */}
                        <Button 
                            onClick={handleAddToCart} 
                            fullWidth
                            className={`
                                h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5
                                ${addedToCart 
                                    ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                                }
                            `}
                        >
                            {addedToCart ? (
                                <span className="flex items-center gap-2 justify-center animate-fade-in">
                                    <Check size={20} strokeWidth={3}/> Adicionado!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 justify-center">
                                    <ShoppingCart size={20}/> Adicionar ao Orçamento
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <ShieldCheck size={14} /> Pagamento 100% Seguro
                        </div>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE IMAGEM FULLSCREEN --- */}
      {selectedImage && (
          <div 
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" 
            onClick={() => setSelectedImage(null)}
          >
              <img 
                src={selectedImage} 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-zoom-in"
                alt="Zoom"
              />
              <button className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all">
                  <X size={24}/>
              </button>
          </div>
      )}
    </div>
  );
};

export default TourDetailsPage;