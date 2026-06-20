'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/app/types';

// Traduções básicas para exemplo
const translations = {
  pt: {
    home: 'Início',
    tours: 'Passeios',
    packages: 'Pacotes',
    about: 'Sobre Nós',
    contact: 'Contato',
    search: 'Buscar',
    cart: 'Carrinho',
    login: 'Entrar',
    book_now: 'Reservar Agora',
    reviews: 'Avaliações',
    duration: 'Duração',
    date: 'Data',
    adults: 'Adultos',
    children: 'Crianças',
    total: 'Total',
    currency: 'Moeda'
  },
  en: {
    home: 'Home',
    tours: 'Tours',
    packages: 'Packages',
    about: 'About Us',
    contact: 'Contact',
    search: 'Search',
    cart: 'Cart',
    login: 'Login',
    book_now: 'Book Now',
    reviews: 'Reviews',
    duration: 'Duration',
    date: 'Date',
    adults: 'Adults',
    children: 'Children',
    total: 'Total',
    currency: 'Currency'
  },
  es: {
    home: 'Inicio',
    tours: 'Paseos',
    packages: 'Paquetes',
    about: 'Nosotros',
    contact: 'Contacto',
    search: 'Buscar',
    cart: 'Carrito',
    login: 'Entrar',
    book_now: 'Reservar Ahora',
    reviews: 'Reseñas',
    duration: 'Duración',
    date: 'Fecha',
    adults: 'Adultos',
    children: 'Niños',
    total: 'Total',
    currency: 'Moneda'
  }
};

// Definição do Tipo do Contexto
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: string; // Adicionado para corrigir o erro da Navbar
  setCurrency: (curr: string) => void; // Adicionado
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  currency: 'BRL',
  setCurrency: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [currency, setCurrency] = useState('BRL'); // Estado da moeda
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language;
    const savedCurr = localStorage.getItem('currency');
    
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) setCurrency(savedCurr);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleSetCurrency = (curr: string) => {
    setCurrency(curr);
    localStorage.setItem('currency', curr);
  };

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['pt']] || key;
  };

  if (!mounted) return <>{children}</>;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage,
      currency,
      setCurrency: handleSetCurrency,
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);