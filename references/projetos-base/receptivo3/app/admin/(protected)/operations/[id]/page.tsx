'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import EscalaOSWizard from '@/components/Admin/wizards/EscalaOSWizard';
import ManifestoWizard from '@/components/Admin/wizards/ManifestoWizard';
import AgendaPaxWizard from '@/components/Admin/wizards/AgendaPaxWizard';

export default function EditServiceOrderPage() {
  const params = useParams();
  const supabase = createClientComponentClient();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const id = params.id as string;

      const { data: os, error } = await supabase
        .from('service_orders')
        .select('*, assigned_guide:drivers_guides(id, name, phone, document_number)')
        .eq('id', id)
        .single();

      if (error || !os) {
        alert('OS não encontrada.');
        setLoading(false);
        return;
      }

      const { data: items } = await supabase
        .from('service_order_items')
        .select('*')
        .eq('service_order_id', id)
        .order('sort_order');

      const { data: passengers } = await supabase
        .from('passengers')
        .select('*')
        .eq('service_order_id', id)
        .order('sort_order');

      setOrder({ ...os, items: items || [], passengers: passengers || [] });
      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">OS não encontrada.</p>
      </div>
    );
  }

  const docType = order.doc_type || 'os';

  if (docType === 'manifesto') return <ManifestoWizard initialData={order} mode="edit" />;
  if (docType === 'agenda') return <AgendaPaxWizard initialData={order} mode="edit" />;
  return <EscalaOSWizard initialData={order} mode="edit" />;
}
