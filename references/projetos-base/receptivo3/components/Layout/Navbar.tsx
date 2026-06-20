'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  Globe, 
  ChevronDown, 
  Search,
  User 
} from 'lucide-react';
import * as Icons from 'lucide-react'; // Para ícones dinâmicos
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useCart } from '@/app/contexts/CartContext';
import { useContent } from '@/app/contexts/ContentContext'; // Consumindo categorias
import CartDrawer from '../Cart/CartDrawer';
import { BrandLogo } from '@/components/Frontend/BrandLogo';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const { language, currency } = useLanguage();
  // Safe default value for items
  const { items = [], setIsCartOpen: setContextCartOpen } = useCart();
  const { categories = [] } = useContent(); 

  // Handler local para abrir carrinho, sincronizando com contexto se necessário
  const handleOpenCart = () => {
    setIsCartOpen(true);
    if (setContextCartOpen) setContextCartOpen(true);
  };

  // Safe reduce calculation
  const cartCount = (items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  const navLinks = [
    { name: 'Sobre Nós', href: '/about' },
    { name: 'Contato', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ];

  const handleCategoryClick = (categorySlug: string) => {
    if (categorySlug === 'blog') {
      router.push('/blog');
    } else if (categorySlug === 'transfers') {
      router.push('/transfers/search');
    } else {
      router.push(`/tours/search?category=${encodeURIComponent(categorySlug)}`);
    }
    setIsMenuOpen(false);
  };

  // Renderiza ícone dinâmico com fallback
  const renderIcon = (iconName: string, className: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className={className} size={20} /> : <Icons.Circle className={className} size={20} />;
  };

  return (
    <>
      {/* 1. TOPO PRINCIPAL (BRANCO) */}
      <nav className="bg-white shadow-sm z-50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 justify-between items-center">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center">
              <BrandLogo height={34} />
            </div>

            {/* Navegação Desktop (Links Institucionais) */}
            <div className="hidden md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    pathname === link.href
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Ações da Direita */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <button className="flex items-center hover:text-primary-600 transition-colors">
                  <Globe className="h-4 w-4 mr-1" />
                  <span className="uppercase">{language}</span>
                </button>
                <button className="flex items-center hover:text-primary-600 font-medium transition-colors">
                  <span>{currency}</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                  <Search className="h-5 w-5" />
                </button>
                <Link href="/minhas-reservas" className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                  <User className="h-5 w-5" />
                </Link>
                <button 
                  onClick={handleOpenCart}
                  className="relative p-2 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Botão Menu Mobile */}
            <div className="flex md:hidden items-center space-x-4">
              <button onClick={handleOpenCart} className="relative p-2 text-gray-400">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-2 shadow-lg absolute w-full z-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 text-base font-medium text-gray-700 hover:text-primary-600 border-b border-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
             <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categorias</p>
                <div className="grid grid-cols-2 gap-2">
                   {categories.filter(c => c.active && !['gastronomia', 'destaques'].includes(c.slug?.toLowerCase())).map(cat => (
                      <button 
                         key={cat.id} 
                         onClick={() => handleCategoryClick(cat.slug)}
                         className="flex items-center gap-2 p-2 text-sm text-left hover:bg-gray-50 rounded"
                      >
                         {renderIcon(cat.icon, "text-primary-500")}
                         {cat.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        )}
      </nav>

      {/* 2. FAIXA AZUL (CATEGORIAS) - Agora parte fixa do Navbar */}
      <div className="bg-primary-600 shadow-md border-t border-primary-400/30 w-full z-40 relative">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-start md:justify-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide py-3 text-white no-scrollbar">
               {categories.length > 0 ? (
                 categories
                   .filter(c => c.active && !['gastronomia', 'destaques'].includes(c.slug?.toLowerCase()))
                   .sort((a,b) => a.order - b.order)
                   .map((cat) => (
                      <li 
                          key={cat.id} 
                          onClick={() => handleCategoryClick(cat.slug)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1 rounded transition-colors whitespace-nowrap group shrink-0"
                      >
                          {renderIcon(cat.icon, "w-4 h-4 md:w-5 md:h-5 opacity-80 group-hover:opacity-100")}
                          <span className="text-xs md:text-sm font-bold uppercase tracking-wide">{cat.label}</span>
                      </li>
                   ))
               ) : (
                 // Fallback visual caso categorias não carreguem
                 <li className="text-xs text-primary-200 py-1">Carregando categorias...</li>
               )}
            </ul>
         </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;