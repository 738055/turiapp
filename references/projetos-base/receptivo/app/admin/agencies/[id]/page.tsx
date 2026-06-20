'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AgencyService } from '@/services/agencyService';
import { Agency } from '@/types';
import AgencyEditor from '@/components/admin/AgencyEditor';

export default function EditAgencyPage() {
  const { id } = useParams<{ id: string }>();
  const [agency, setAgency] = useState<Agency | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AgencyService.getById(id).then(data => {
      setAgency(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Carregando...</div>;
  if (!agency) return <div className="text-center py-20 text-red-500">Agência não encontrada.</div>;

  return <AgencyEditor initialData={agency} isEditMode />;
}
