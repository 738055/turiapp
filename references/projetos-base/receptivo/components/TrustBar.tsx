'use client';

import React from 'react';
import { STATS } from '@/constants';
import { Award, MapPin, Users, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap: { [key: string]: React.ElementType } = {
  Award,
  MapPin,
  Users,
  Star,
};

const TrustBar = () => {
  const { language } = useLanguage();

  return (
    <section className="bg-white py-8 border-b border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => {
            const Icon = iconMap[stat.iconName] || Star;
            return (
              <div key={stat.id} className="flex flex-col items-center gap-1">
                <Icon className="w-8 h-8 text-secondary" strokeWidth={1.5} />
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">{stat.label[language]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;