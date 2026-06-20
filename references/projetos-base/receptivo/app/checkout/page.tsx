
'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Trash, MessageCircle, MapPin, User, Phone, Calendar, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button';
import Link from '../../components/Link';
import { trackEvent } from '@/utils/analytics';

export default function CheckoutPage() {
  const { items, removeFromCart, total, clearCart } = useCart();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    hotel: '',
    notes: ''
  });

  // Rastreia quando a pessoa ENTRA na página de checkout
  useEffect(() => {
    if (items.length > 0) {
      trackEvent('InitiateCheckout', {
        value: total,
        currency: 'BRL',
        items: items.map(item => ({
          item_id: item.tourId,
          item_name: item.tourTitle,
          price: item.pricingType === 'per_person' && item.guests > 0 ? item.price / item.guests : item.price,
          quantity: item.pricingType === 'per_person' ? item.guests : 1,
        })),
      });
    }
  }, [items, total]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) return;

    const orderId = Math.floor(Math.random() * 100000);
    const now = new Date();

    // Build the WhatsApp Message
    let message = `🌟 *NOVA SOLICITAÇÃO DE RESERVA* 🌟%0A`;
    message += `📅 Data: ${now.toLocaleDateString()} às ${now.toLocaleTimeString()}%0A`;
    message += `🆔 *ID Cotação: ${orderId}*%0A%0A`;
    
    message += `👤 *DADOS DO CLIENTE*%0A`;
    message += `Nome: ${formData.name}%0A`;
    message += `WhatsApp: ${formData.phone}%0A`;
    message += `📍 Local de Busca (Hotel): ${formData.hotel}%0A`;
    if (formData.notes) message += `📝 Obs: ${formData.notes}%0A`;
    message += `%0A`;

    message += `🛒 *RESUMO DO PEDIDO*%0A`;
    message += `-----------------------------------%0A`;
    
    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.tourTitle}*%0A`;
      message += `   📅 Data: ${item.date || 'A definir'}%0A`;
      message += `   👥 Pax: ${item.guests} ${item.pricingType === 'per_vehicle' ? '(Veículo Privado)' : 'Pessoas'}%0A`;
      message += `   💰 Valor Ref: R$ ${item.price}%0A%0A`;
    });

    message += `-----------------------------------%0A`;
    message += `💵 *TOTAL ESTIMADO: R$ ${total}*%0A`;
    message += `-----------------------------------%0A`;
    message += `Aguardo link de pagamento e confirmação. Obrigado!`;

    // Rastreamento de Conversão (Purchase)
    trackEvent('Purchase', {
        value: total,
        currency: 'BRL',
        transaction_id: `ORDER_${orderId}`,
        // Passamos o Label exato que o Google Ads forneceu para "Compra"
        gAdsConversionLabel: 'AW-17952330633/ZhvwCNGFy_gbEImnq_BC', 
        items: items.map(item => ({
          item_id: item.tourId,
          item_name: item.tourTitle,
          price: item.pricingType === 'per_person' && item.guests > 0 ? item.price / item.guests : item.price,
          quantity: item.pricingType === 'per_person' ? item.guests : 1,
        })),
      });

    const phoneNumber = "5545991083852"; // Replace with actual agency number
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    
    setTimeout(() => {
        clearCart(); 
        window.open(url, '_blank');
    }, 300);
  };

  if (items.length === 0) {
    return (
        <div className="min-h-screen pt-24 bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="text-gray-400" size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
                <p className="text-gray-500 mb-6">Explore nossas experiências e adicione passeios incríveis à sua viagem.</p>
                <Link href="/" className="block">
                    <Button fullWidth>Explorar Passeios</Button>
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-gray-800 mb-8">Finalizar Cotação</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* User Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Seus Dados</h2>
                    </div>
                    
                    <form id="checkout-form" onSubmit={handleFinalize} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">WhatsApp / Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    type="tel"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="+55 (00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Local de Busca (Hotel)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    required
                                    name="hotel"
                                    value={formData.hotel}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Nome do Hotel ou Endereço"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Observações (Opcional)</label>
                            <textarea 
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                                placeholder="Alguma restrição alimentar? Necessidade especial? Horário específico?"
                            />
                        </div>
                    </form>
                </div>

                {/* Items Review Mobile (Hidden on Desktop usually, but let's keep inline for simplicity or keep standard) */}
            </div>

            {/* Summary Sticky Sidebar */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                    <h3 className="font-serif font-bold text-xl text-gray-800 mb-6">Resumo da Cotação</h3>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 relative group pb-4 border-b border-gray-100 last:border-0">
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-gray-800 leading-tight">{item.tourTitle}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <Calendar size={12} />
                                        <span>{item.date || 'Data a definir'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <User size={12} />
                                        <span>{item.guests} {item.pricingType === 'per_vehicle' ? 'Veículo' : 'Pessoas'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-primary text-sm">R$ {item.price}</div>
                                    <button 
                                        onClick={() => removeFromCart(idx)}
                                        className="text-red-400 hover:text-red-600 p-1 mt-1 opacity-50 group-hover:opacity-100 transition-opacity"
                                        title="Remover"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                         <div className="flex justify-between items-center text-gray-600 text-sm">
                            <span>Subtotal</span>
                            <span>R$ {total}</span>
                         </div>
                         <div className="flex justify-between items-center text-primary font-bold text-2xl pt-2">
                            <span>Total Estimado</span>
                            <span>R$ {total}</span>
                         </div>
                         <p className="text-[10px] text-gray-400 text-center leading-tight mt-2">
                            * Valores sujeitos a alteração e disponibilidade. O pagamento será combinado via WhatsApp.
                         </p>
                    </div>

                    <div className="mt-6 space-y-3">
                        <Button 
                            type="submit" 
                            form="checkout-form"
                            fullWidth 
                            className="flex items-center justify-center gap-2 !bg-[#25D366] hover:!bg-[#20b858] shadow-[#25D366]/20"
                        >
                            <MessageCircle size={20} />
                            Finalizar no WhatsApp
                        </Button>
                        
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                            <ShieldCheck size={14} className="text-primary" />
                            <span>Reserva Segura e Sem Taxas Ocultas</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
