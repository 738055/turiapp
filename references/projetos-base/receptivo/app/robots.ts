import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Bloqueia acesso de robôs a áreas administrativas
    },
    sitemap: 'https://www.a10receptivoiguassu.com/sitemap.xml',
  };
}