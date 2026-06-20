'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { useCart } from '@/app/contexts/CartContext';
import { CheckCircle, Download, Home, Printer, MapPin, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { trackPurchase } from '@/app/lib/tracking';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  
  // Usamos um estado local para recuperar os detalhes da compra, 
  // já que o carrinho é limpo após o sucesso.
  // Num cenário real, buscaríamos os dados da reserva pelo ID via API.
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (redirectStatus === 'succeeded') {
      const lastCart = localStorage.getItem('reserva_cart');
      const alreadyTracked = sessionStorage.getItem(`tracked_${paymentIntent}`);

      if (lastCart) {
        try {
          const parsed = JSON.parse(lastCart);
          setOrderDetails(parsed);
          // Evento de compra confirmada (GA4 + Meta Pixel) — dispara apenas 1x
          if (paymentIntent && Array.isArray(parsed) && !alreadyTracked) {
            const total = parsed.reduce((sum: number, i: any) => sum + (i.subtotal || i.price || 0), 0);
            const items = parsed.map((i: any) => ({
              id: i.product?.id || i.id,
              name: i.product?.name || i.name,
              price: i.product?.price || i.price || 0,
              type: i.product?.type || 'tour',
              quantity: (i.adults || 1) + (i.children || 0),
            }));
            trackPurchase(paymentIntent, total, items);
            sessionStorage.setItem(`tracked_${paymentIntent}`, '1');
          }
        } catch (e) { console.error(e); }
      }
      clearCart();
    }
  }, [redirectStatus, paymentIntent, clearCart]);

  if (!paymentIntent || redirectStatus !== 'succeeded') {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Processando...</h1>
              <p className="text-gray-500">Aguarde enquanto confirmamos seu pagamento.</p>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
       <div className="max-w-3xl mx-auto">
          {/* Card de Sucesso */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 animate-fade-in-up">
             <div className="bg-green-500 p-8 text-center text-white">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                   <CheckCircle size={48} className="text-green-500" />
                </div>
                <h1 className="text-3xl font-black mb-2">Pagamento Confirmado!</h1>
                <p className="text-green-100 text-lg">Sua reserva foi realizada com sucesso.</p>
                <p className="text-sm mt-4 opacity-80">ID da Transação: {paymentIntent}</p>
             </div>

             <div className="p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Detalhes da Reserva</h2>
                
                {/* Lista de Itens Comprados */}
                <div className="space-y-6 mb-8">
                   {orderDetails && orderDetails.map((item: any) => (
                      <div key={item.internalId || item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                         {/* Fallback de segurança para imagem */}
                         <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                            {/* CORREÇÃO: Suporte Híbrido (caso venha do cache antigo ou novo) */}
                            {item.product?.imageUrl || item.imageUrl ? (
                                <img 
                                  src={item.product?.imageUrl || item.imageUrl} 
                                  alt={item.product?.name || item.name} 
                                  className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                            )}
                         </div>
                         
                         <div className="flex-1">
                            {/* CORREÇÃO: Acesso seguro via item.product.name ou fallback */}
                            <h3 className="font-bold text-gray-800 mb-2">{item.product?.name || item.name}</h3>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                               <div className="flex items-center gap-1">
                                  <Calendar size={14} className="text-primary-500"/>
                                  <span>{item.date ? new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                  <Users size={14} className="text-primary-500"/>
                                  <span>{item.adults + item.children} Pessoas</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                             {/* CORREÇÃO: Preço pode vir de subtotal ou cálculo manual */}
                            <span className="block font-black text-lg text-primary-600">
                               {(item.subtotal || item.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Info Box */}
                <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 mb-8">
                   <h4 className="font-bold text-primary-900 mb-2">O que acontece agora?</h4>
                   <ul className="space-y-2 text-sm text-primary-800">
                      <li className="flex items-start gap-2">
                         <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                         Você receberá um e-mail com os vouchers das atividades.
                      </li>
                      <li className="flex items-start gap-2">
                         <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                         Apresente o voucher (digital ou impresso) no local da atividade.
                      </li>
                      <li className="flex items-start gap-2">
                         <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                         Em caso de dúvidas, nossa equipe de suporte está à disposição.
                      </li>
                   </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                      <Printer size={18} /> Imprimir Vouchers
                   </button>
                   <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                      <Home size={18} /> Voltar ao Início
                   </Link>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <PublicLayout>
       <Suspense fallback={<div>Carregando confirmação...</div>}>
         <SuccessContent />
       </Suspense>
    </PublicLayout>
  );
}