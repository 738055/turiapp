'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Mail, MapPin, Phone, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { BrandLogo } from '@/components/Frontend/BrandLogo';

export const PratikFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-secondary text-gray-400 pt-20 pb-10">
      {/* Faixa-acento da marca (colinas + sol) */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-sun to-accent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="mb-6">
              <BrandLogo height={44} onDark />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
              Sua agência de turismo local em Foz do Iguaçu. Oferecemos as melhores experiências, passeios e transfers com o conforto e a segurança que você merece.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-all duration-300 group">
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-all duration-300 group">
                <Facebook size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://wa.me/5545999406579" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-white transition-all duration-300 group">
                <Phone size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
          
          {/* Links Columns */}
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold uppercase tracking-wide text-xs mb-6">Serviços</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/tours/search" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Passeios
                </Link>
              </li>
              <li>
                <Link href="/transfers/search" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Transfers
                </Link>
              </li>
              <li>
                <Link href="/tours/search?category=combos" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Combos
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Dicas de Foz
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-semibold uppercase tracking-wide text-xs mb-6">Institucional</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/about" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent transition-colors flex items-center gap-2 group">
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-accent transition-colors" />
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4">
            <h4 className="text-white font-semibold uppercase tracking-wide text-xs mb-6">Fale Conosco</h4>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-tighter mb-1">Email</p>
                  <p className="text-white font-bold tracking-tight">contato@pratikturismo.com.br</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-tighter mb-1">Localização</p>
                  <p className="text-white font-bold tracking-tight leading-relaxed">
                    Av. Juscelino Kubitscheck, 874<br/>
                    Foz do Iguaçu, PR
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-xs font-bold text-gray-500">&copy; {currentYear} Pratik Turismo. Todos os direitos reservados.</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black">CNPJ: 00.000.000/0001-00</p>
            </div>
            
            {/* Payment & Security Logos */}
            <div className="flex flex-wrap justify-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black tracking-widest uppercase">Site Seguro</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <CreditCard size={16} />
                <span className="text-[10px] font-black tracking-widest uppercase">Stripe</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-[10px] font-black tracking-widest uppercase italic">VISA</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-[10px] font-black tracking-widest uppercase italic">Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};