// app/blog/page.tsx
import { Metadata } from 'next';
import SoroBlog from '@/components/SoroBlog';

export const metadata: Metadata = {
  title: 'Blog e Dicas | A10 Receptivo',
  description: 'Descubra as melhores dicas, roteiros e curiosidades sobre Foz do Iguaçu.',
};

export default function BlogPage() {
  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Blog & Experiências</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Explore nossos artigos exclusivos para tornar sua viagem a Foz do Iguaçu inesquecível.</p>
        </div>
        <SoroBlog />
      </div>
    </div>
  );
}