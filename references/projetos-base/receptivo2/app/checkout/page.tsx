'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, Users, CreditCard, Lock, CheckCircle, Loader2, Tag, X } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '@/components/Checkout/StripePaymentForm';
import { formatCurrency } from '@/app/lib/productUtils';

export default function CheckoutPage() {
  const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
  const router = useRouter();

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
     async function loadStripeKey() {
        const { data } = await supabase.from('system_settings').select('stripe_public_key').single();
        if (data && data.stripe_public_key) {
           setStripePromise(loadStripe(data.stripe_public_key));
        } else {
          console.error("Stripe public key not found in system_settings.");
        }
     }
     loadStripeKey();
  }, []);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    phone: '',
    document: ''
  });

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setVerifyingCoupon(true);
    setCouponError('');

    try {
       const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', couponCode.toUpperCase().trim())
          .eq('active', true)
          .single();

       if (error || !data) {
          setCouponError('Cupom inválido ou não encontrado.');
          setAppliedCoupon(null);
       } else {
          const now = new Date();
          const expirationDate = data.expiration_date ? new Date(data.expiration_date) : null;

          if (expirationDate && expirationDate < now) {
             setCouponError('Este cupom expirou.');
             setAppliedCoupon(null);
          } else if (data.max_uses && data.used_count >= data.max_uses) {
             setCouponError('Limite de uso deste cupom atingido.');
             setAppliedCoupon(null);
          } else if (data.min_purchase_amount && cartTotal < data.min_purchase_amount) {
             setCouponError(`Valor mínimo para aplicar: ${formatCurrency(data.min_purchase_amount)}`);
             setAppliedCoupon(null);
          } else {
             setAppliedCoupon(data);
             setCouponError('');
          }
       }
    } catch (err) {
       console.error(err);
       setCouponError('Erro ao validar cupom.');
    } finally {
       setVerifyingCoupon(false);
    }
  };

  const calculateTotals = () => {
    let discountAmount = 0;
    if (appliedCoupon) {
       if (appliedCoupon.discount_type === 'percentage') {
          discountAmount = cartTotal * (Number(appliedCoupon.discount_value) / 100);
       } else {
          discountAmount = Number(appliedCoupon.discount_value);
       }
       if (discountAmount > cartTotal) discountAmount = cartTotal;
    }
    const subtotalAfterCoupon = cartTotal - discountAmount;
    const pixDiscount = paymentMethod === 'pix' ? subtotalAfterCoupon * 0.05 : 0;
    const finalTotal = subtotalAfterCoupon - pixDiscount;
    return { discountAmount, pixDiscount, finalTotal };
  };

  const { discountAmount, pixDiscount, finalTotal } = calculateTotals();

  const handleProceedToPayment = async () => {
    if (customer.email !== customer.confirmEmail) {
      alert('Os e-mails não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const sanitizedCartItems = cartItems.map(item => {
        // Only send fields the backend needs — prices are recalculated server-side
        return {
          product: { id: item.product.id, name: item.product.name },
          date: item.date,
          time: item.time,
          adults: item.adults,
          children: item.children,
          quantity: item.quantity,
          selectedExtras: item.selectedExtras,
          selectedTiers: item.selectedTiers,
          pickupLocation: (item as any).pickupLocation,
        };
      });

      const affiliateId = localStorage.getItem('affiliate_id');

      const response = await fetch('/api/bookings/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: sanitizedCartItems,
          customer: customer,
          paymentMethod: paymentMethod,
          couponCode: appliedCoupon?.code || null,
          affiliateId,
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro ao criar a reserva.');
      }

      if(data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        // Compra com valor zero (cupom 100%) — redireciona com params para success page funcionar
        clearCart();
        router.push(`/checkout/success?payment_intent=free_${data.bookingId}&redirect_status=succeeded`);
      }

    } catch (error: any) {
      console.error(error);
      alert('Erro de conexão: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    router.push('/checkout/success');
  };

  if (cartItems.length === 0 && !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
           <h2 className="text-xl font-bold text-secondary mb-2">Seu carrinho está vazio</h2>
           <p className="text-gray-500 mb-6">Escolha alguns passeios incríveis para continuar.</p>
           <button onClick={() => router.push('/')} className="bg-primary text-white font-semibold py-2.5 px-6 rounded-lg w-full hover:bg-primary-dark transition-colors">
              Voltar aos passeios
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-8 flex items-center gap-2">
           <Lock className="text-success" size={26}/> Finalizar reserva
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1 space-y-6">
             {!clientSecret ? (
                <>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                        <h2 className="text-xl font-bold text-gray-800">Seus Dados</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none" placeholder="Como no documento" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                            <input type="email" className="w-full border border-gray-300 rounded-lg p-3" placeholder="Para envio do voucher" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar E-mail</label>
                            <input type="email" className={`w-full border rounded-lg p-3 ${customer.confirmEmail && customer.email !== customer.confirmEmail ? 'border-red-500' : 'border-gray-300'}`} placeholder="Digite novamente" value={customer.confirmEmail} onChange={e => setCustomer({...customer, confirmEmail: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Celular / WhatsApp</label>
                            <input type="tel" className="w-full border border-gray-300 rounded-lg p-3" placeholder="(00) 00000-0000" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">CPF ou Passaporte</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg p-3" placeholder="Documento do titular" value={customer.document} onChange={e => setCustomer({...customer, document: e.target.value})} />
                        </div>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                        <h2 className="text-xl font-bold text-gray-800">Pagamento</h2>
                      </div>
                      <div className="space-y-3">
                        <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="w-5 h-5 text-primary" />
                            <CreditCard className="text-gray-600"/>
                            <div>
                              <span className="block font-bold text-gray-800">Cartão de Crédito</span>
                              <span className="text-xs text-gray-500">Pagamento seguro via Stripe</span>
                            </div>
                        </label>
                        <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="w-5 h-5 text-primary" />
                            <div className="font-bold text-success">PIX</div>
                            <div>
                              <span className="block font-semibold text-gray-800">Pagamento instantâneo</span>
                              <span className="text-xs text-success font-semibold">-5% de desconto extra</span>
                            </div>
                        </label>
                      </div>
                  </div>
                </>
             ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center font-bold">
                            <Lock size={16}/>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Insira os Dados de Pagamento</h2>
                    </div>
                    {!stripePromise ? (
                        <div className="p-8 text-center text-gray-500">Conectando ao gateway de pagamento...</div>
                    ) : (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <StripePaymentForm
                                totalAmount={finalTotal}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setClientSecret('')}
                            />
                        </Elements>
                    )}
                </div>
             )}
          </div>

          <div className="w-full lg:w-96 shrink-0">
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Resumo do Pedido</h3>

                <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2 border-b border-gray-100 pb-4">
                   {cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img src={item.product.imageUrl} className="w-full h-full object-cover" alt={item.product.name}/>
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-gray-800 line-clamp-1">{item.product.name}</h4>
                            <div className="text-gray-500 text-xs flex items-center gap-1 mt-1"><Calendar size={10}/> {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                            <div className="text-gray-500 text-xs flex items-center gap-1"><Users size={10}/> {item.quantity || ((item.adults || 0) + (item.children || 0))} pessoas</div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold text-gray-800">{formatCurrency(item.subtotal || 0)}</div>
                            <button onClick={() => removeFromCart(item.internalId)} className="text-red-400 hover:text-red-600 text-xs mt-1"><Trash2 size={14}/></button>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="mb-6">
                   {!appliedCoupon && !clientSecret && (
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Tag size={12}/> Cupom de Desconto</label>
                         <div className="flex gap-2">
                            <input type="text" className={`flex-1 border rounded-lg p-2 text-sm uppercase font-mono ${couponError ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-300 focus:ring-primary'}`} placeholder="CÓDIGO" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                            <button onClick={handleApplyCoupon} disabled={!couponCode || verifyingCoupon} className="bg-secondary text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary-light disabled:opacity-50 transition-colors">{verifyingCoupon ? <Loader2 className="animate-spin" size={14}/> : 'Aplicar'}</button>
                         </div>
                         {couponError && <p className="text-xs text-red-500 mt-1 font-medium">{couponError}</p>}
                      </div>
                   )}
                   {appliedCoupon && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center animate-fadeIn">
                         <div>
                            <span className="block text-[10px] font-bold text-green-800 uppercase tracking-wide">Cupom Ativo</span>
                            <span className="font-mono font-bold text-green-700 text-sm">{appliedCoupon.code}</span>
                            <span className="text-xs text-green-600 ml-1">({appliedCoupon.discount_type === 'percentage' ? `-${appliedCoupon.discount_value}%` : `-${formatCurrency(Number(appliedCoupon.discount_value))}`})</span>
                         </div>
                         {!clientSecret && <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-green-700 hover:text-green-900 bg-green-100 p-1 rounded-full"><X size={14}/></button>}
                      </div>
                   )}
                </div>

                <div className="space-y-2 mb-6">
                   <div className="flex justify-between text-gray-600 text-sm"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                   {appliedCoupon && (<div className="flex justify-between text-green-600 text-sm font-bold bg-green-50/50 p-1 rounded"><span>Desconto</span><span>- {formatCurrency(discountAmount)}</span></div>)}
                   {paymentMethod === 'pix' && (<div className="flex justify-between text-primary-600 text-sm font-medium"><span>Desconto PIX (5%)</span><span>- {formatCurrency(pixDiscount)}</span></div>)}
                   <div className="flex justify-between text-xl font-bold text-secondary pt-4 border-t border-gray-100"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={loading || !customer.name || !customer.email || !customer.document || !!clientSecret}
                  className="w-full bg-success hover:bg-success-dark text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={20}/>}
                   {loading ? 'Processando...' : 'Ir para Pagamento'}
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
