'use client';

import React, { useState } from 'react';
import { BlogPost } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './Button';
import Link from './Link';

interface InfoCarouselProps {
  posts: BlogPost[];
}

const InfoCarousel: React.FC<InfoCarouselProps> = ({ posts }) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!posts || posts.length === 0) {
    return null; // Não renderiza nada se não houver posts
  }

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? posts.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === posts.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <section className="bg-gray-50 py-20">
      <div className="relative container mx-auto px-4">
        <div className="overflow-hidden rounded-2xl">
          <div 
            className="flex transition-transform ease-out duration-500"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="min-w-full flex-shrink-0 group">
                <div className="relative w-full h-96">
                  <img src={post.imageUrl} alt={post.title[language]} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-8 flex flex-col justify-end">
                    <h3 className="text-3xl font-serif font-bold text-white mb-2 group-hover:text-secondary transition-colors">{post.title[language]}</h3>
                    <p className="text-white/80 max-w-2xl">{post.shortDesc[language]}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <Button onClick={prevSlide} variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-4 !p-3 rounded-full bg-white/80 hover:bg-white shadow-lg"><ArrowLeft /></Button>
        <Button onClick={nextSlide} variant="ghost" className="absolute top-1/2 -translate-y-1/2 right-4 !p-3 rounded-full bg-white/80 hover:bg-white shadow-lg"><ArrowRight /></Button>
      </div>
    </section>
  );
};

export default InfoCarousel;