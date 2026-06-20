'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

export default function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkModal = async () => {
      // Verifica se o usuário já fechou na sessão atual
      const hasSeen = sessionStorage.getItem('promo_seen');
      if (hasSeen) return;

      const { data } = await supabase
        .from('system_settings')
        .select('promo_modal_active, promo_modal_title, promo_modal_text, promo_modal_coupon_code')
        .single();

      if (data?.promo_modal_active) {
        setSettings(data);
        // Delay de 5 segundos para não abrir imediatamente na cara do usuário
        setTimeout(() => setIsOpen(true), 5000); 
      }
    };
    checkModal();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('promo_seen', 'true');
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden animate-bounce-in">
         {/* Botão Fechar */}
         <button onClick={handleClose} className="absolute top-4 right-4 text-white/80 hover:text-white z-10 transition-colors">
           <X size={24} />
         </button>
         
         {/* Topo (Estilo idêntico ao antigo) */}
         <div className="bg-primary p-6 text-center text-white">
           <h3 className="text-2xl font-bold mb-1">{settings.promo_modal_title}</h3>
           {/* Se não houver cupom, usamos o text principal aqui para ficar mais clean, senão usamos como subtítulo */}
           {!settings.promo_modal_coupon_code && (
               <p className="text-sm opacity-90 mt-2">{settings.promo_modal_text}</p>
           )}
         </div>
         
         {/* Corpo */}
         <div className="p-6 text-center">
           {settings.promo_modal_coupon_code && (
             <>
                <p className="text-gray-600 mb-4">{settings.promo_modal_text}</p>
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-2">Use o cupom no carrinho:</p>
                  <div className="inline-block border-2 border-dashed border-primary bg-primary-50 text-primary font-mono font-black text-xl px-4 py-2 rounded-lg tracking-widest">
                    {settings.promo_modal_coupon_code}
                  </div>
                </div>
             </>
           )}

           <button onClick={handleClose} className="w-full bg-urgent text-white font-bold py-3 rounded-lg hover:bg-urgent-dark transition-colors">
             Continuar Navegando
           </button>
         </div>
      </div>
    </div>
  );
}