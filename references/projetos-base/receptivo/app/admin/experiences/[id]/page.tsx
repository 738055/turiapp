import React from 'react';
import { TourService } from '@/services/tourService';
import ExperienceWizard from '@/components/admin/ExperienceWizard';

// FORÇA O NEXT.JS A NÃO FAZER CACHE DESTA PÁGINA
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditExperiencePage({ params }: { params: { id: string } }) {
  // Busca dados no servidor (Server Component) SEMPRE frescos
  const tour = await TourService.getById(params.id);

  if (!tour) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">Experiência não encontrada</h2>
      </div>
    );
  }

  return <ExperienceWizard initialData={tour} isEditMode={true} />;
}