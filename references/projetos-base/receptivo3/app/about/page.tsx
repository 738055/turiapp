import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import { MapPin, Users, ShieldCheck, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre a Pratik Turismo',
  description: 'Agência receptiva local em Foz do Iguaçu. Conheça a Pratik Turismo, nossa equipe e os serviços que oferecemos.',
};

const pillars = [
  { icon: MapPin, title: 'Receptivo local', desc: 'Equipe baseada em Foz do Iguaçu, com conhecimento real da região e das três fronteiras.' },
  { icon: Users, title: 'Guias credenciados', desc: 'Profissionais habilitados para conduzir passeios nas Cataratas, Itaipu e atrações da cidade.' },
  { icon: ShieldCheck, title: 'Operação segura', desc: 'Transfers com veículos próprios, motoristas experientes e reserva online com confirmação.' },
  { icon: Headphones, title: 'Suporte de ponta a ponta', desc: 'Acompanhamento antes, durante e depois da viagem — do aeroporto ao último passeio.' },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-primary-700 font-semibold text-sm mb-1.5">Quem somos</p>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
            Turismo receptivo em Foz do Iguaçu
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            A Pratik Turismo organiza passeios, ingressos, transfers e roteiros completos
            na Terra das Cataratas. Cuidamos de cada detalhe da sua viagem para que você
            só precise aproveitar — com transporte, atrações e compras no Paraguai e Argentina.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 flex gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-bold text-secondary mb-1">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-secondary rounded-2xl px-6 py-10 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pronto para conhecer Foz?</h2>
            <p className="text-white/70 max-w-xl">Monte seu roteiro com a nossa equipe ou explore os passeios disponíveis.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/tours/search" className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Ver passeios
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Falar conosco
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
