'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, ChevronRight } from 'lucide-react';
import { useCart } from '@/app/contexts/CartContext';
import { BrandLogo } from '@/components/Frontend/BrandLogo';

export const PratikNavbar = () => {
  const { items = [] } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const cartCount = items.reduce((sum, item) => sum + (item.adults + (item.children || 0)), 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Destinos', href: '/tours/search' },
    { name: 'Passeios', href: '/tours/search' },
    { name: 'Transfers', href: '/transfers/search' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contato', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-lg border-b ${
      scrolled
        ? 'shadow-soft border-gray-100 py-3'
        : 'border-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <BrandLogo height={scrolled ? 40 : 46} priority />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors hover:bg-primary-50 text-secondary hover:text-primary ${
                  pathname === link.href ? 'text-primary' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Ações (Carrinho e Login) */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/checkout"
              className="relative p-2 transition-all rounded-full hover:bg-primary/5 text-secondary"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce-in">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors bg-primary text-white hover:bg-primary-dark"
            >
              <User size={18} />
              Entrar
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link
              href="/checkout"
              className="relative p-2 text-secondary"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl transition-colors text-secondary bg-gray-100 hover:bg-gray-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white shadow-premium transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[500px] border-t border-gray-100' : 'max-h-0'
      }`}>
        <div className="p-6 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 text-secondary font-bold transition-colors"
            >
              {link.name}
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link 
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white p-4 rounded-2xl font-bold shadow-premium"
            >
              <User size={20} />
              Entrar na minha conta
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};