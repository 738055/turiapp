'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Banner, Product, BlogPost, Category } from '@/app/types';

export interface CompanyInfo {
  company_name: string;
  cnpj: string;
  contact_email: string;
  phone: string;
  address: string;
}

interface ContentContextType {
  banners: Banner[];
  updateBanners: (newBanners: Banner[]) => void;
  blogPosts: BlogPost[];
  products: Product[];
  updateProducts: (newProducts: Product[]) => void;
  categories: Category[];
  companyInfo: CompanyInfo;
  loading: boolean;
  getFeaturedProducts: () => Product[];
  getFeaturedTransfers: () => Product[];
  getFeaturedTours: () => Product[];
}

const defaultCompanyInfo: CompanyInfo = {
  company_name: 'Pratik Turismo Ltda',
  cnpj: '34.563.274/0001-00',
  contact_email: 'contato@pratikturismo.com.br',
  phone: '+55 45-99101-7224',
  address: 'R. Jorge Sanwais, 724 - Centro, Foz do Iguaçu - PR, 85851-150',
};

const defaultContext: ContentContextType = {
  banners: [],
  updateBanners: () => {},
  blogPosts: [],
  products: [],
  updateProducts: () => {},
  categories: [],
  companyInfo: defaultCompanyInfo,
  loading: true,
  getFeaturedProducts: () => [],
  getFeaturedTransfers: () => [],
  getFeaturedTours: () => [],
};

const ContentContext = createContext<ContentContextType>(defaultContext);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [loading, setLoading] = useState(true);

  // Carregar Conteúdo do Supabase
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Banners
        const { data: bannersData } = await supabase
           .from('banners')
           .select('*')
           .eq('active', true)
           .order('display_order', { ascending: true });
        
        if (bannersData) {
           const formattedBanners = bannersData.map((b: any) => ({
              id: b.id,
              imageUrl: b.image_url,
              title: b.title,
              subtitle: b.subtitle,
              buttonText: b.button_text,
              link: b.link,
              align: b.align,
              active: b.active,
              order: b.display_order
           }));
           setBanners(formattedBanners);
        }

        // 2. Fetch Posts (Blog)
        const { data: postsData } = await supabase
           .from('posts')
           .select('*')
           .eq('published', true)
           .order('created_at', { ascending: false })
           .limit(3);

        if (postsData) {
            const formattedPosts = postsData.map((p: any) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                content: p.content,
                excerpt: p.excerpt,
                imageUrl: p.cover_image,
                date: new Date(p.created_at).toLocaleDateString('pt-BR'),
                author: 'Equipe Reserva',
                active: p.published
            }));
            setBlogPosts(formattedPosts);
        }

        // 5. Fetch Categories
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('active', true);

        let formattedCategories: Category[] = [];
        if (categoriesData && categoriesData.length > 0) {
            formattedCategories = categoriesData.map((c: any) => ({
                id: c.id,
                slug: c.slug,
                label: c.name || c.label || 'Categoria',
                icon: c.icon || 'HelpCircle',
                order: c.order || 0,
                active: c.active
            }));
            setCategories(formattedCategories);
        } else {
            // Fallback para evitar menu vazio se o banco falhar
            const fallbackCategories = [
                { id: '1', slug: 'tours', label: 'Passeios', icon: 'Map', active: true, order: 1 },
                { id: '2', slug: 'transfers', label: 'Transportes', icon: 'Car', active: true, order: 2 },
                { id: '3', slug: 'ingressos', label: 'Ingressos', icon: 'Ticket', active: true, order: 3 },
                { id: '4', slug: 'compras', label: 'Compras', icon: 'ShoppingBag', active: true, order: 4 },
            ];
            setCategories(fallbackCategories);
            formattedCategories = fallbackCategories;
        }

        // 3. Fetch Products (Tours, Transfers, etc)
        const { data: productsData } = await supabase
           .from('products')
           .select('*')
           .eq('availability', true);

        if (productsData) {
            const formattedProducts = productsData.map((p: any) => {
                const meta = p.metadata || {}; // <--- Extraindo o metadado
                const category = formattedCategories.find(c => c.id === p.category_id);

                return {
                    id: p.id,
                    slug: p.slug,
                    name: p.title,
                    description: p.description,
                    price: Number(p.price),
                    compareAtPrice: p.compare_at_price ?? undefined,
                    imageUrl: p.images?.[0] || '/images/placeholder.jpg',
                    gallery: p.images || [],
                    active: p.availability,
                    isFeatured: p.featured,
                    category: category?.slug || '',
                    categoryId: p.category_id || '',
                    type: meta.type || 'tour',
                    duration: p.duration,
                    location: p.location ?? undefined,
                    // null = produto sem avaliações ainda ("Novo") — nunca usar fallback numérico
                    rating: p.rating ?? null,
                    reviewsCount: p.reviews_count ?? null,

                    // Cancelamento real (campo booleano)
                    is_free_cancellation: meta.is_free_cancellation ?? false,

                    // Dados do Wizard
                    features: meta.features || (p as any).includes || [],
                    notIncluded: meta.notIncluded || (p as any).excludes || [],
                    cancellationPolicy: p.cancellation_policy || meta.cancellationPolicy || '',
                    importantInfo: p.important_info || meta.importantInfo || '',
                    guideLanguages: meta.guideLanguages || [],
                    tags: meta.tags || [],
                    transferDetails: meta.transferDetails,
                    pricingTiers: meta.pricingTiers || [],
                    extras: meta.extras || [],
                    itinerary: meta.itinerary || []
                };
            }) as Product[];
            setProducts(formattedProducts);
        }

        // 4. Fetch Company Info (apenas campos públicos — sem SMTP/chaves)
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('company_name, cnpj, contact_email, phone, address')
          .single();

        if (settingsData) {
          setCompanyInfo({
            company_name: settingsData.company_name || defaultCompanyInfo.company_name,
            cnpj:          settingsData.cnpj          || defaultCompanyInfo.cnpj,
            contact_email: settingsData.contact_email || defaultCompanyInfo.contact_email,
            phone:         settingsData.phone         || defaultCompanyInfo.phone,
            address:       settingsData.address       || defaultCompanyInfo.address,
          });
        }

      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const updateBanners = (newBanners: Banner[]) => setBanners(newBanners);
  const updateProducts = (newProducts: Product[]) => setProducts(newProducts);

  // --- Implementação das Funções Helpers ---

  const getFeaturedProducts = () => {
    return products.filter(p => p.isFeatured && p.active);
  };

  const getFeaturedTransfers = () => {
    // Busca Transfers tanto pela estrutura (type) quanto pela categoria visual
    return products.filter(p => (p.type === 'transfer' || p.category === 'transfers') && p.active && p.isFeatured);
  };

  const getFeaturedTours = () => {
    // Agora o carrossel de destaque puxa a experiência completa!
    return products.filter(p => 
      (['tour', 'ticket', 'package'].includes(p.type) || p.category === 'tours') 
      && p.active 
      && p.isFeatured
    );
  };

  return (
    <ContentContext.Provider value={{
        banners,
        updateBanners,
        blogPosts,
        products,
        updateProducts,
        categories,
        companyInfo,
        loading,
        getFeaturedProducts,
        getFeaturedTransfers,
        getFeaturedTours,
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);