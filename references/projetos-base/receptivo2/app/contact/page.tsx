import React from 'react';
import type { Metadata } from 'next';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { MessageCircle, Mail, MapPin, Clock, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a Pratik Turismo em Foz do Iguaçu. WhatsApp, e-mail e atendimento presencial para montar o seu roteiro.',
};

const channels = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '(45) 99940-6579',
    href: 'https://wa.me/5545999406579',
    cta: 'Conversar agora',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'contato@pratikturismo.com.br',
    href: 'mailto:contato@pratikturismo.com.br',
    cta: 'Enviar e-mail',
  },
];

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-primary-700 font-semibold text-sm mb-1.5">Atendimento</p>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Fale com a Pratik</h1>
          <p className="text-gray-500 max-w-2xl">
            Somos uma agência local em Foz do Iguaçu. Tire dúvidas, peça um roteiro
            personalizado ou reserve seus passeios diretamente com a nossa equipe.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Canais diretos */}
          <div className="space-y-4">
            {channels.map(({ icon: Icon, label, value, href, cta }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400">{label}</p>
                  <p className="font-bold text-secondary">{value}</p>
                </div>
                <span className="text-primary font-semibold text-sm group-hover:translate-x-0.5 transition-transform">
                  {cta} →
                </span>
              </a>
            ))}
          </div>

          {/* Informações da agência */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary">Endereço</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Av. Juscelino Kubitscheck, 874<br />
                  Foz do Iguaçu — PR
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-5 border-t border-gray-100">
              <Clock size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary">Horário de atendimento</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Segunda a sexta: 8h–12h e 14h–18h<br />
                  Sábado: 8h–12h
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-5 border-t border-gray-100">
              <Phone size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary">Telefone / WhatsApp</p>
                <p className="text-gray-500 text-sm">(45) 99940-6579</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
