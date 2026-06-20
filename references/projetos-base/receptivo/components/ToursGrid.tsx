import React from 'react';
import { TourService } from '@/services/tourService';
import TourCard from './TourCard';
import { Tour } from '@/types';

interface ToursGridProps {
  tours?: Tour[];
  featuredOnly?: boolean;
  limit?: number;
}

const ToursGrid: React.FC<ToursGridProps> = async ({ tours: toursProp, featuredOnly = false, limit }) => {
  let toursToRender: Tour[] = toursProp || [];
  
  // If no tours are passed via props, fetch them internally.
  if (!toursProp) {
    try {
      toursToRender = featuredOnly 
        ? await TourService.getFeatured()
        : await TourService.getAll();
  
      if (limit) {
        toursToRender = toursToRender.slice(0, limit);
      }
    } catch (error) {
      console.error("Failed to fetch tours:", error);
      return <p className="text-center text-red-500">Erro ao carregar os passeios.</p>;
    }
  }

  // The parent component on the /experiencias page handles the "no results" message.
  // This message will show on the home page if no featured tours are found.
  if (toursToRender.length === 0 && !toursProp) {
    return <p className="text-center text-gray-500">Nenhum passeio encontrado.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {toursToRender.map(tour => (<TourCard key={tour.id} tour={tour} />))}
    </div>
  );
};

export default ToursGrid;