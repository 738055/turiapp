'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';

export interface CompanyInfo {
  company_name: string;
  cnpj: string;
  cnpj_formatted: string;
  contact_email: string;
  phone: string;
  address: string;
}

function formatCNPJ(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) return raw;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const DEFAULTS: CompanyInfo = {
  company_name: 'Pratik Turismo Ltda',
  cnpj: '34563274000100',
  cnpj_formatted: '34.563.274/0001-00',
  contact_email: 'contato@pratikturismo.com.br',
  phone: '+55 45-99101-7224',
  address: 'R. Jorge Sanwais, 724 - Centro, Foz do Iguaçu - PR, 85851-150',
};

export function useCompanyInfo() {
  const supabase = createClientComponentClient();
  const [company, setCompany] = useState<CompanyInfo>(DEFAULTS);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('company_name, cnpj, contact_email, phone, address')
      .single()
      .then(({ data }) => {
        if (data) {
          const cnpj = data.cnpj || DEFAULTS.cnpj;
          setCompany({
            company_name: data.company_name || DEFAULTS.company_name,
            cnpj,
            cnpj_formatted: formatCNPJ(cnpj),
            contact_email: data.contact_email || DEFAULTS.contact_email,
            phone: data.phone || DEFAULTS.phone,
            address: data.address || DEFAULTS.address,
          });
        }
      });
  }, [supabase]);

  return company;
}
