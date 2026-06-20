import React from 'react';
import { PublicLayout } from '@/components/Layout/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-gray-600">Nós valorizamos sua privacidade...</p>
      </div>
    </PublicLayout>
  );
}