'use client'
import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export const StripePaymentForm = ({ totalAmount, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    // Se chegou aqui é porque NÃO houve redirect (ou seja, houve erro)
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        alert(error.message);
      } else {
        alert("Ocorreu um erro inesperado. Tente novamente.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="flex gap-4 mt-6">
        <button 
          type="submit" 
          disabled={!stripe} 
          className="w-full bg-success hover:bg-success-dark text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Pagar {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};