import React from 'react';
import { notFound } from 'next/navigation';
import { TourService } from '@/services/tourService';
import TourDetailsPage from '@/components/TourDetailsPage';
import { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';

// Força renderização dinâmica para garantir dados sempre frescos (preços/disponibilidade)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tour = await TourService.getBySlug(params.slug);
  
  if (!tour) {
    return {
      title: 'Experiência não encontrada | A10 Receptivo',
      robots: { index: false } // Evita indexar páginas de erro 404
    };
  }

  const title = tour.title?.pt || 'Detalhes do Passeio';
  const description = tour.seo?.metaDescription?.pt || tour.description?.pt || 'Reserve seu passeio em Foz do Iguaçu.';
  const url = `https://www.a10receptivoiguassu.com/tour/${tour.slug}`;

  return {
    title: `${title} | A10 Receptivo`,
    description: description,
    alternates: {
      canonical: url,
    },
    openGraph: {
        title: title,
        description: description,
        url: url,
        images: tour.image ? [{ url: tour.image, width: 1200, height: 630, alt: title }] : [],
        type: 'website',
    }
  };
}

export default async function Page({ params }: PageProps) {
  const tour = await TourService.getBySlug(params.slug);

  if (!tour) {
    return notFound();
  }

  // Schema de Produto para Google (Rich Snippets)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tour.title?.pt,
    "image": tour.image ? [tour.image] : [],
    "description": tour.description?.pt,
    "brand": {
      "@type": "Brand",
      "name": "A10 Receptivo"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.a10receptivoiguassu.com/tour/${tour.slug}`,
      "priceCurrency": "BRL",
      "price": tour.basePrice,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "A10 Receptivo"
      }
    },
    // Adiciona estrelas se houver avaliações
    ...(tour.rating ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": tour.rating,
        "reviewCount": tour.reviewsCount || 1,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {})
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <TourDetailsPage tour={tour} />
    </>
  );
}