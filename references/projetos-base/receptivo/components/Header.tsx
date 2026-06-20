'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, ChevronRight, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from './Link'; 
import Button from './Button';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { items, checkout } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // Fecha o menu se mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Bloqueia o scroll da página quando o menu mobile estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Ativa o fundo branco se rolar mais de 20px ou se não estiver na home
      setIsScrolled(window.scrollY > 20 || pathname !== '/');
    };
    
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Define se o header deve ser sólido (branco) ou transparente
  const showSolidHeader = isScrolled;

  const navLinks = [
    { name: t.nav.home, href: '/' },
    { name: t.nav.about, href: '/sobre' },
    { name: t.nav.tours, href: '/experiencias' },
    { name: t.nav.service, href: '/servicos' },
    { name: t.nav.faq, href: '/faq' },
    { name: t.nav.blog, href: '/blog' },
    { name: t.nav.contact, href: '/contato' },
  ];

  const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ] as const;

  const getCurrentFlag = () => languages.find(l => l.code === language)?.flag;
  const logoSrc = "/logo.png";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out h-20 flex items-center ${
          showSolidHeader ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center h-full">
          {/* LOGO */}
          <Link href="/" className="flex items-center group relative z-50 shrink-0 h-full">
              <img 
                src={logoSrc} 
                alt="A10 Receptivo Logo" 
                className={`transition-all duration-300 object-contain ${
                  showSolidHeader 
                    ? 'h-12 filter-none' 
                    : 'h-14 md:h-16 brightness-0 invert' 
                }`} 
              />
          </Link>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`font-sans font-medium text-[11px] lg:text-xs uppercase tracking-widest hover:text-secondary transition-colors duration-300 relative group whitespace-nowrap ${
                  showSolidHeader ? 'text-gray-800' : 'text-white'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full ${pathname === link.href ? 'w-full' : ''}`}></span>
              </Link>
            ))}
            
            <div className="h-6 w-px bg-gray-300/30 mx-1"></div>

            {/* SELETOR DE IDIOMA */}
            <div className="relative">
              <button 
                className={`flex items-center gap-1 font-bold text-xs ${showSolidHeader ? 'text-gray-800' : 'text-white'}`}
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              >
                <span className="text-base">{getCurrentFlag()}</span>
                <span className="uppercase">{language}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-full right-0 mt-3 bg-white shadow-xl rounded-lg overflow-hidden py-1 min-w-[120px] animate-fade-in border border-gray-100">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setIsLangMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-xs hover:bg-gray-50 text-gray-700 ${language === lang.code ? 'bg-blue-50 font-bold text-primary' : ''}`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CARRINHO (DESKTOP) */}
            <div className="relative cursor-pointer group" onClick={checkout}>
              <ShoppingBag className={`transition-colors duration-300 ${showSolidHeader ? 'text-gray-800 group-hover:text-primary' : 'text-white group-hover:text-secondary'}`} size={20} />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </div>

            <Link href="/experiencias">
              <Button 
                  variant={showSolidHeader ? 'primary' : 'secondary'} 
                  className="text-[10px] py-2 px-4 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all whitespace-nowrap"
              >
                  {t.nav.bookNow}
              </Button>
            </Link>
          </nav>

          {/* CONTROLES MOBILE (Carrinho + Toggle Menu) */}
          <div className="flex items-center gap-4 md:hidden z-50">
              <div className="relative cursor-pointer" onClick={checkout}>
                  <ShoppingBag className={`transition-colors duration-300 ${showSolidHeader ? 'text-gray-800' : 'text-white'}`} size={24} />
                  {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {items.length}
                  </span>
                  )}
              </div>

            <button 
              className="focus:outline-none p-1 transition-transform active:scale-95"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
               <Menu className={showSolidHeader ? "text-gray-800" : "text-white"} size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU OVERLAY (BACKDROP) --- */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 backdrop-blur-sm ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* --- MOBILE MENU DRAWER (LATERAL) --- */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do Menu Mobile */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
           <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Menu</span>
           <button 
             onClick={() => setIsMobileMenuOpen(false)}
             className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 hover:text-red-500 transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        {/* Links de Navegação */}
        <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-2">
            {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    pathname === link.href 
                      ? 'bg-green-50 text-primary font-bold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg font-medium">{link.name}</span>
                  <ChevronRight size={18} className={`opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 ${pathname === link.href ? 'opacity-100 translate-x-0 text-primary' : 'text-gray-400'}`} />
                </Link>
            ))}

            <hr className="my-4 border-gray-100" />

            {/* Seletor de Idioma Mobile */}
            <div className="flex gap-3 justify-center py-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setIsMobileMenuOpen(false); }}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all text-2xl ${
                          language === lang.code 
                            ? 'border-primary bg-primary/10 shadow-sm scale-105' 
                            : 'border-gray-100 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                        }`}
                    >
                        {lang.flag}
                    </button>
                ))}
            </div>
        </div>

        {/* Footer do Menu Mobile (Botão de Ação) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <Link href="/experiencias" onClick={() => setIsMobileMenuOpen(false)}>
               <Button variant="primary" className="w-full py-4 text-lg shadow-lg flex items-center justify-center gap-2">
                  {t.nav.bookNow}
               </Button>
            </Link>
            <div className="mt-4 text-center">
               <a href="https://wa.me/5545991083852" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <Phone size={14} />
                  <span>Precisa de ajuda? Fale conosco</span>
               </a>
            </div>
        </div>
      </div>
    </>
  );
};

export default Header;