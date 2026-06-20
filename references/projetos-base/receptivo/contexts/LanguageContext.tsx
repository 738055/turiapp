'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '@/utils/translations';
import { Language } from '@/types';

type TranslationKeys = typeof translations.pt;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = translations[language];

  return (<LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>);
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) { throw new Error('useLanguage must be used within a LanguageProvider'); }
  return context;
};