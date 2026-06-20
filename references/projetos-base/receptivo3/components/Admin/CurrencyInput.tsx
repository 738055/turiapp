'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Formata centavos (inteiro) para string no formato brasileiro: 3.000,00
 */
function formatFromCents(cents: number): string {
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Input com máscara de moeda brasileira (R$ 3.000,00).
 * Internamente trabalha com centavos para evitar problemas de ponto flutuante.
 * O `value` e `onChange` usam o valor em reais (number com decimais).
 */
export default function CurrencyInput({ value, onChange, className = '', placeholder }: CurrencyInputProps) {
  const cents = Math.round((value || 0) * 100);
  const [display, setDisplay] = useState(() => formatFromCents(cents));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza quando o valor externo muda (ex: reset do form)
  useEffect(() => {
    const newCents = Math.round((value || 0) * 100);
    setDisplay(formatFromCents(newCents));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é dígito
    const raw = e.target.value.replace(/\D/g, '');
    const numCents = parseInt(raw || '0', 10);

    setDisplay(formatFromCents(numCents));
    onChange(numCents / 100);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona tudo ao focar para facilitar edição
    setTimeout(() => e.target.select(), 0);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none">
        R$
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className={`pl-10 ${className}`}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder || '0,00'}
      />
    </div>
  );
}
