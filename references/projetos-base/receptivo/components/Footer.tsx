'use client';

import React from 'react';
import { NEWS } from '../constants';
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation'; //
import Button from './Button';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const pathname = usePathname(); // Hook para pegar a rota atual

  // Se estiver no painel admin, não renderiza o Footer principal
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // Uses local logo.png
  const logoSrc = "/logo.png";

  return (
    <footer className="bg-[#1A1A1A] text-white pt-24 pb-10 border-t border-white/5">
      {/* Newsletter Strip */}
      <div className="container mx-auto px-4 mb-20">
        <div className="bg-primary rounded-xl p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
           
           <div className="mb-8 lg:mb-0 lg:pr-12 relative z-10 max-w-xl">
             <h3 className="font-serif font-bold text-3xl md:text-4xl mb-4 leading-tight">{t.footer.newsletterTitle}</h3>
             <p className="text-white/80 text-lg font-light">{t.footer.newsletterDesc}</p>
           </div>
           
           <div className="w-full lg:w-auto flex-1 max-w-md relative z-10">
             <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
               <input 
                 type="email" 
                 placeholder={t.footer.emailPlaceholder}
                 className="flex-grow px-6 py-4 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner"
               />
               <Button variant="secondary" className="whitespace-nowrap py-4 px-8 shadow-lg">
                 {t.footer.subscribe}
               </Button>
             </form>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 border-b border-white/10 pb-16">
        
        {/* Brand / Services */}
        <div>
          <img src={logoSrc} alt="A10 Receptivo" className="h-10 mb-8 brightness-0 invert" />
          
          <h4 className="font-serif font-bold text-xl text-white mb-6 relative inline-block">
            {t.footer.servicesTitle}
            <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-secondary"></span>
          </h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-secondary transition-colors block py-1">{t.footer.service1}</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors block py-1">{t.footer.service2}</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors block py-1">{t.footer.service3}</a></li>
            <li><a href="#" className="hover:text-secondary transition-colors block py-1">{t.footer.service4}</a></li>
          </ul>
        </div>

        {/* News */}
        <div className="lg:col-span-2">
          <h4 className="font-serif font-bold text-xl text-white mb-8 relative inline-block">
            {t.footer.newsTitle}
            <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-secondary"></span>
          </h4>
          <ul className="space-y-6">
            {NEWS.map((item) => (
              <li key={item.id} className="group">
                <a href="#" className="flex items-start gap-4">
                  <span className="text-secondary mt-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">&rarr;</span>
                  <div>
                      <h5 className="text-white font-medium group-hover:text-secondary transition-colors leading-snug">{item.title}</h5>
                      <span className="text-xs text-gray-500 mt-1 block uppercase tracking-wider">{t.footer.readArticle}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-serif font-bold text-xl text-white mb-8 relative inline-block">
            {t.footer.supportTitle}
            <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-secondary"></span>
          </h4>
          <ul className="space-y-5 text-sm text-gray-400">
            <li className="flex items-center gap-4 group cursor-pointer">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                 <Phone size={18} />
               </div>
               <span className="group-hover:text-white transition-colors">+55 (45) 99108-3852</span>
            </li>
            <li className="flex items-center gap-4 group cursor-pointer">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                 <MessageCircleIcon size={18} />
               </div>
               <span className="group-hover:text-white transition-colors">+55 (45) 99108-3852</span>
            </li>
            <li className="flex items-center gap-4 group cursor-pointer">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                 <Mail size={18} />
               </div>
               <span className="group-hover:text-white transition-colors">a10receptivo@gmail.com</span>
            </li>
            <li className="mt-8">
                <div className="flex space-x-3">
                    <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-secondary hover:border-secondary hover:text-white transition-all"><Facebook size={18} /></a>
                    <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-secondary hover:border-secondary hover:text-white transition-all"><Instagram size={18} /></a>
                    <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-secondary hover:border-secondary hover:text-white transition-all"><Youtube size={18} /></a>
                </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-medium uppercase tracking-widest">
        <p>{t.footer.copyright}</p>
        <div className="mt-4 md:mt-0 space-x-8">
            <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
            <a href="#" className="hover:text-white transition-colors">{t.footer.sitemap}</a>
        </div>
      </div>
    </footer>
  );
};

// Helper icon
const MessageCircleIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

export default Footer;