'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseBrowser';
import ProductFormWrapper from '@/components/Admin/wizards/ProductFormWrapper';
import { Loader2 } from 'lucide-react';
import { Product } from '@/app/types';
import { useParams } from 'next/navigation'; // 1. Adicionado o import do hook

export default function EditProductPage() {
  // 2. Trocamos o recebimento via "props" pelo hook oficial do Next.js
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // 3. Trava de segurança para aguardar a montagem completa da URL
    if (!id) return;

    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories:category_id (label, slug)')
        .eq('id', id) // 4. Usamos a variável segura "id"
        .single();

      if (error) {
        console.error('Erro ao buscar produto:', error);
      } else if (data) {
        const meta = data.metadata || {};

        const formatted: Product = {
          id: data.id,
          name: data.title,
          slug: data.slug,
          description: data.description || '',
          price: data.price,
          compareAtPrice: data.compare_at_price ?? undefined,
          costPrice: data.cost_price ?? undefined,
          supplierId: data.supplier_id ?? undefined,
          isFixedTime: data.is_fixed_time,
          capacityPerSlot: data.capacity_per_slot ?? undefined,
          categoryId: data.category_id || undefined,
          category: (data.categories as any)?.slug || 'sem-categoria',
          imageUrl: data.images?.[0] || '/images/placeholder.jpg',
          gallery: data.images || [],
          active: data.availability,
          isFeatured: data.featured,
          rating: data.rating ?? null,
          reviewsCount: data.reviews_count ?? null,
          location: data.location ?? undefined,
          duration: data.duration ?? undefined,
          type: meta.type || 'tour',
          features: meta.features || [],
          notIncluded: meta.notIncluded || [],
          tags: meta.tags || [],
          cancellationPolicy: meta.cancellationPolicy || '',
          is_free_cancellation: meta.is_free_cancellation ?? false,
          importantInfo: meta.importantInfo || '',
          pricingTiers: meta.pricingTiers || [],
          transferDetails: meta.transferDetails,
          extras: meta.extras || [],
          itinerary: meta.itinerary || [],
          guideLanguages: meta.guideLanguages || [],
          metadata: meta,
        };
        setProduct(formatted);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id, supabase]); // 5. Dependências atualizadas

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p>Carregando dados do produto...</p>
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-gray-500">Produto não encontrado.</div>;

  return (
    <div className="p-4">
      <ProductFormWrapper mode="edit" initialData={product} />
    </div>
  );
}
