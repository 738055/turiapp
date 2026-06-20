import React from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Termos de Uso</h1>
        <p className="text-gray-600">Conteúdo dos termos de uso...</p>
      </div>
    </PublicLayout>
  );
}