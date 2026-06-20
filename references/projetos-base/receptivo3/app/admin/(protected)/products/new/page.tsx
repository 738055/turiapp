import React from 'react';
import ProductFormWrapper from '@/components/Admin/wizards/ProductFormWrapper';

export const metadata = {
  title: 'Novo Produto | Admin',
};

export default function NewProductPage() {
  return (
    <div className="p-4">
      <ProductFormWrapper mode="create" />
    </div>
  );
}