'use client';

import React from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { X, Trash2, Calendar, Users, ArrowRight, ShoppingBag, ShoppingCart, Plus, Clock, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/app/lib/productUtils';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { isCartOpen: contextIsOpen, setIsCartOpen: setContextIsOpen, items = [], removeFromCart, cartTotal } = useCart();
  const router = useRouter();

  const showDrawer = isOpen !== undefined ? isOpen : contextIsOpen;
  
  const handleClose = () => {
    if (onClose) onClose();
    else setContextIsOpen(false);
  };

  if (!showDrawer) return null;

  const handleCheckout = () => {
    handleClose();
    router.push('/checkout');
  };

  // Função auxiliar para renderizar os Passageiros / Tarifas corretamente
  const renderPassengers = (item: any) => {
     if (item.selectedTiers && Object.keys(item.selectedTiers).length > 0 && item.product.pricingTiers) {
         const activeTiers = Object.entries(item.selectedTiers)
           .filter(([_, qty]) => (qty as number) > 0)
           .map(([tierId, qty]) => {
              const tierDef = item.product.pricingTiers?.find((t: any) => t.id === tierId);
              return `${qty}x ${tierDef?.name || 'Ingresso'}`;
           });
         return activeTiers.join(', ');
     }
     // Fallback padrão
     return `${item.adults + item.children} Passageiros`;
  };

  // Função auxiliar para renderizar os Extras com seus nomes reais
  const renderExtras = (item: any) => {
     if (!item.selectedExtras || Object.keys(item.selectedExtras).length === 0) return null;
     
     const extrasList = Object.entries(item.selectedExtras)
         .filter(([_, qty]) => (qty as number) > 0)
         .map(([key, qty]) => {
             const extraDef = item.product.extras?.find((e: any) => e.id === key || e.name === key);
             return `${qty}x ${extraDef?.name || key}`;
         });

     if (extrasList.length === 0) return null;

     return (
         <div className="mt-2 flex flex-wrap gap-1">
           {extrasList.map((ex, i) => (
              <span key={i} className="text-primary text-[10px] font-black bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Plus size={10} /> {ex}
              </span>
           ))}
         </div>
     );
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-secondary/60 backdrop-blur-sm transition-opacity duration-500"
        onClick={handleClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header Redesigned */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                <ShoppingCart size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-black text-2xl text-secondary tracking-tighter leading-none">Seu Carrinho</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
           </div>
           <button 
            onClick={handleClose} 
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 text-secondary hover:bg-gray-100 transition-all active:scale-90 relative z-10"
           >
              <X size={24} strokeWidth={2.5} />
           </button>
        </div>

        {/* Content Redesigned */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
           {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                 <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-soft">
                    <ShoppingBag size={48} className="text-gray-200" />
                 </div>
                 <h3 className="text-2xl font-black text-secondary mb-3 tracking-tight">O carrinho está vazio</h3>
                 <p className="text-gray-500 font-medium text-sm leading-relaxed mb-10">Que tal adicionar algumas experiências incríveis em Foz do Iguaçu agora?</p>
                 <button 
                   onClick={handleClose}
                   className="w-full bg-secondary text-white font-black py-5 rounded-2xl hover:bg-secondary-light transition-all shadow-premium active:scale-95 uppercase tracking-widest text-xs"
                 >
                   Explorar Passeios
                 </button>
              </div>
           ) : (
              items.map(item => (
                 <div key={item.internalId} className="flex gap-5 group relative">
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-gray-100 shrink-0 shadow-soft border border-gray-100">
                       <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <div className="flex-1 flex flex-col">
                       <div className="flex justify-between items-start gap-3 mb-2">
                          <h3 className="font-black text-sm text-secondary leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.product.name}</h3>
                          <button 
                             onClick={() => removeFromCart(item.internalId)}
                             className="text-gray-300 hover:text-red-500 transition-colors p-1"
                             title="Remover"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                       
                       <div className="flex flex-col gap-1.5 mb-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            <Calendar size={12} className="text-primary" /> 
                            <span>{item.date}</span>
                            {item.time && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <Clock size={12} className="text-primary" />
                                <span>{item.time}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                            <Users size={12} className="text-primary" />
                            <span>{renderPassengers(item)}</span>
                          </div>
                       </div>

                       {renderExtras(item)}

                       <div className="mt-4 flex justify-between items-end">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Subtotal</span>
                          <span className="font-black text-secondary text-lg tracking-tighter">{formatCurrency(item.subtotal || 0)}</span>
                       </div>
                    </div>
                 </div>
              ))
           )}
        </div>

        {/* Footer Redesigned */}
        {items.length > 0 && (
           <div className="p-8 border-t border-gray-100 bg-gray-50/50">
              <div className="bg-white rounded-3xl p-6 shadow-soft mb-8 border border-gray-100/50">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Valor Total</span>
                      <span className="text-4xl font-black text-secondary tracking-tighter leading-none">{formatCurrency(cartTotal)}</span>
                   </div>
                   <div className="bg-success/10 text-success p-2.5 rounded-2xl flex flex-col items-center gap-0.5">
                      <CreditCard size={18} />
                      <span className="text-[8px] font-black uppercase tracking-tight">Até 10x</span>
                   </div>
                </div>
                <p className="text-[11px] font-bold text-gray-400 leading-tight">
                  Taxas inclusas. Pagamento seguro com criptografia SSL de 256 bits.
                </p>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-3xl shadow-premium shadow-primary/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-xs group"
              >
                <span>FINALIZAR COMPRA</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                 onClick={handleClose}
                 className="w-full text-center text-gray-400 text-[10px] font-black uppercase tracking-widest mt-6 hover:text-secondary transition-colors"
              >
                 Continuar Comprando
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;