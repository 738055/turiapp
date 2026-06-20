'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FaqEditor from '@/components/admin/FaqEditor';
import { FaqService } from '@/services/faqService';
import { Faq } from '@/types';

export default function EditFaqPage() {
  const params = useParams();
  const [data, setData] = useState<Faq | null>(null);

  useEffect(() => {
    if(params.id) {
        FaqService.getById(params.id as string).then(setData);
    }
  }, [params.id]);

  if(!data) return <div className="p-8 text-center">Carregando...</div>;

  return <FaqEditor initialData={data} />;
}