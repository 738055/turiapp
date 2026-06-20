import { MetadataRoute } from 'next';
import { TourService } from '@/services/tourService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.a10receptivoiguassu.com';

  // Inicializa arrays vazios para evitar falhas no build caso o banco esteja inacessível
  let tours: any[] = [];
  let posts: any[] = [];
  
  try {
    tours = await TourService.getAll();
    posts = await TourService.getAllPosts();
  } catch (error) {
    console.error('Erro ao buscar dados para sitemap:', error);
  }

  // 1. Mapeie Tours (Prioridade Alta - Seus Produtos)
  const tourUrls = tours
    .filter(t => t.status === 'published')
    .map((tour) => ({
      url: `${baseUrl}/tour/${tour.slug}`,
      lastModified: new Date(), // Idealmente, use a data de atualização do tour se tiver no banco
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

  // 2. Mapeie Blog Posts
  const postUrls = posts
    .filter(p => p.isActive)
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`, // Confirme se sua rota é /blog ou /experience
      lastModified: new Date(post.createdAt || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // 3. Rotas Estáticas Principais
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/servicos`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...tourUrls, ...postUrls];
}