'use client';

import React from 'react';
import { REVIEWS } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Quote } from 'lucide-react';

const Reviews = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-primary">O que nossos clientes dizem</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {REVIEWS.map(review => (
            <div key={review.id} className="bg-white p-8 rounded-2xl shadow-lg relative">
              <Quote className="absolute top-4 right-4 text-primary/10" size={48} />
              <div className="flex items-center mb-4">
                <div className="flex text-secondary">{Array.from({ length: review.rating }).map((_, i) => (<Star key={i} size={20} fill="currentColor" />))}</div>
              </div>
              <p className="text-gray-600 italic mb-6">"{review.content[language]}"</p>
              <p className="font-bold text-gray-800">{review.name}</p>
              <p className="text-sm text-gray-500">Fonte: {review.source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;