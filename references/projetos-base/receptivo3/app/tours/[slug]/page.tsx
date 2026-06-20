// Next.js 16+:
//   1. params é uma Promise — deve ser aguardado antes de usar
//   2. createServerComponentClient (auth-helpers) é incompatível com Next.js 16
//      porque cookies() agora é assíncrono. Para páginas públicas usamos o
//      cliente anônimo direto (@/lib/supabase) — mesma instância que ContentContext.
import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { ProductDetailPageClient } from './ProductDetailPageClient';
import { Product } from '@/app/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pratikturismo.com.br';

// ── Metadados dinâmicos ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: p } = await supabase
    .from('products')
    .select('title, description, images, slug')
    .eq('slug', slug)
    .single();

  if (!p) return { title: 'Produto não encontrado | Pratik Turismo' };

  const title = `${p.title} | Pratik Turismo`;
  const description =
    p.description?.substring(0, 160) ||
    'Passeio incrível em Foz do Iguaçu. Reserve agora com cancelamento grátis.';
  const image = p.images?.[0] || '/images/og-default.jpg';
  const url = `${BASE_URL}/tours/${p.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      locale: 'pt_BR',
      siteName: 'Pratik Turismo',
      images: [{ url: image, width: 1200, height: 630, alt: p.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: dbProduct, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id ( label )
    `)
    .eq('slug', slug)
    .single();

  if (error || !dbProduct) {
    console.error(`[slug/page] Produto não encontrado: "${slug}"`, error?.message);
    notFound();
  }

  const productData: Product = {
    id: dbProduct.id,
    slug: dbProduct.slug,
    name: dbProduct.title,
    description: dbProduct.description || '',
    shortDescription: dbProduct.short_description || '',

    price: Number(dbProduct.price),
    compareAtPrice: dbProduct.compare_at_price ? Number(dbProduct.compare_at_price) : undefined,
    costPrice: dbProduct.cost_price ? Number(dbProduct.cost_price) : undefined,

    imageUrl:
      dbProduct.images && dbProduct.images.length > 0
        ? dbProduct.images[0]
        : '/images/placeholder.jpg',
    gallery: dbProduct.images || [],

    categoryId: dbProduct.category_id,
    category: (dbProduct.categories as any)?.label || 'Geral',
    supplierId: dbProduct.supplier_id || undefined,

    location: dbProduct.location || '',
    duration: dbProduct.duration || '',
    isFixedTime: dbProduct.is_fixed_time || false,
    capacityPerSlot: dbProduct.capacity_per_slot || undefined,

    // null = novo produto; NUNCA usar || fallback numérico
    rating: dbProduct.rating ?? null,
    reviewsCount: dbProduct.reviews_count ?? null,

    isFeatured: dbProduct.featured || false,
    active: dbProduct.availability !== false,
    type: dbProduct.metadata?.type || 'tour',

    features: dbProduct.metadata?.features || dbProduct.includes || [],
    notIncluded: dbProduct.metadata?.notIncluded || dbProduct.excludes || [],
    cancellationPolicy:
      dbProduct.cancellation_policy || dbProduct.metadata?.cancellationPolicy || '',
    importantInfo: dbProduct.important_info || dbProduct.metadata?.importantInfo || '',
    is_free_cancellation: dbProduct.metadata?.is_free_cancellation ?? false,

    itinerary: dbProduct.metadata?.itinerary || [],
    extras: dbProduct.metadata?.extras || [],
    tags: dbProduct.metadata?.tags || [],
    pricingTiers: dbProduct.metadata?.pricingTiers || [],
    guideLanguages: dbProduct.metadata?.guideLanguages || [],
    transferDetails:
      dbProduct.metadata?.transferDetails ||
      dbProduct.metadata?.transfer_details ||
      undefined,
  };

  // ── JSON-LD Schema.org ───────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': productData.type === 'transfer' ? 'Service' : 'Product',
    name: productData.name,
    description: productData.description,
    image: productData.gallery?.length ? productData.gallery : [productData.imageUrl],
    url: `${BASE_URL}/tours/${productData.slug}`,
    ...(productData.location && {
      areaServed: { '@type': 'Place', name: productData.location },
    }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: productData.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/tours/${productData.slug}`,
      seller: { '@type': 'Organization', name: 'Pratik Turismo' },
    },
    ...(productData.rating != null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.rating.toFixed(1),
        reviewCount: productData.reviewsCount ?? 1,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    provider: { '@type': 'Organization', name: 'Pratik Turismo', url: BASE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailPageClient product={productData} />
    </>
  );
}
