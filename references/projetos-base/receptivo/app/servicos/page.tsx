// a10receptivo2.0/app/servicos/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Car, Plane, Ticket, Briefcase, Map, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Serviços de Transfer e Turismo | A10 Receptivo',
  description: 'Transfers aeroporto, city tours, transporte para eventos e ingressos. Tudo o que você precisa em Foz do Iguaçu em um só lugar.',
};

export default function ServicesPage() {
  const services = [
    {
      icon: Plane,
      title: 'Transfer Aeroporto (IGU)',
      desc: 'Chegue com tranquilidade. Monitoramos seu voo e aguardamos no desembarque com placa de identificação.'
    },
    {
      icon: Map,
      title: 'Passeios Turísticos',
      desc: 'Levamos você às Cataratas (BR/AR), Itaipu, Parque das Aves e Marco das Três Fronteiras com conforto.'
    },
    {
      icon: Briefcase,
      title: 'Corporativo & Eventos',
      desc: 'Logística completa para congressos e reuniões. Vans executivas e coordenação de transporte para grandes grupos.'
    },
    {
      icon: Ticket,
      title: 'Ingressos Antecipados',
      desc: 'Facilitamos sua entrada nos atrativos. Compre ingressos conosco e evite filas nas bilheterias.'
    },
    {
      icon: Car,
      title: 'Diárias à Disposição',
      desc: 'Veículo com motorista à sua disposição pelo tempo que precisar, para compras ou reuniões.'
    },
    {
      icon: Star,
      title: 'Experiências VIP',
      desc: 'Jantares exclusivos, passeios de helicóptero e barcos privados para momentos especiais.'
    }
  ];

  return (
    <main className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Nossos Serviços</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
                Nossos serviços de transporte e Guias de Turismo credenciados lhes proporcionarão experiencias incriveis em todos os nossos atrativos da tríplice fronteira.
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        <s.icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{s.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{s.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </main>
  );
}