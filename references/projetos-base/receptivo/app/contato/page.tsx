// a10receptivo2.0/app/contato/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import Button from '@/components/Button';

export const metadata: Metadata = {
  title: 'Fale Conosco | A10 Receptivo',
  description: 'Entre em contato para orçamentos, dúvidas ou reservas. Atendimento rápido via WhatsApp e E-mail.',
};

export default function ContactPage() {
  return (
    <main className="pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Info */}
            <div>
                <span className="text-secondary font-bold uppercase tracking-wider text-sm">Atendimento</span>
                <h1 className="text-4xl font-serif font-bold text-gray-900 mt-2 mb-6">Estamos aqui por você</h1>
                <p className="text-gray-600 mb-10 text-lg">
                    Tem dúvidas sobre roteiros? Precisa de uma cotação especial para grupos? 
                    Nossa equipe está pronta para ajudar a planejar sua viagem ideal.
                </p>

                <div className="space-y-6">
                    <a href="https://wa.me/5545991083852" target="_blank" className="flex items-center gap-5 p-6 bg-green-50 rounded-2xl border border-green-100 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">WhatsApp</h3>
                            <p className="text-green-700 font-medium">Conversar agora &rarr;</p>
                        </div>
                    </a>

                    <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-gray-100">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Telefone</h3>
                            <p className="text-gray-600">+55 (45) 99108-3852</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-gray-100">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">E-mail</h3>
                            <p className="text-gray-600">a10receptivo@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Envie uma mensagem</h3>
                <form className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nome</label>
                            <input type="text" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Seu nome" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                            <input type="tel" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="(00) 00000-0000" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">E-mail</label>
                        <input type="email" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="seu@email.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Assunto</label>
                        <select className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all bg-white">
                            <option>Cotação de Transfer</option>
                            <option>Reserva de Passeios</option>
                            <option>Grupos e Eventos</option>
                            <option>Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mensagem</label>
                        <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all h-32 resize-none" placeholder="Como podemos ajudar?" />
                    </div>
                    <Button fullWidth className="py-4 text-lg">Enviar Solicitação</Button>
                </form>
            </div>
        </div>
      </div>
    </main>
  );
}