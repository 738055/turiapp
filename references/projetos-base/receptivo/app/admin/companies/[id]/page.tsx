'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CompanyService } from '@/services/companyService';
import { Company } from '@/types';
import CompanyEditor from '@/components/admin/CompanyEditor';

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CompanyService.getById(id).then(data => {
      setCompany(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Carregando...</div>;
  if (!company) return <div className="text-center py-20 text-red-500">Empresa não encontrada.</div>;

  return <CompanyEditor initialData={company} isEditMode />;
}
