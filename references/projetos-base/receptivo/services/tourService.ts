import { supabase } from '@/lib/supabaseClient';
import { Tour, BlogPost, VehicleTier } from '../types';
import { TOURS as MOCK_TOURS } from '../constants';

// Mocks de fallback
let localTours: Tour[] = MOCK_TOURS.map(t => ({
  ...t,
  status: 'published' as const,
  category: t.category || 'adventure',
  seo: { metaTitle: t.title, metaDescription: t.description },
  vehicleTiers: t.vehicleTiers || [],
  seasonalRules: [],
  location: t.location || { pt: 'Foz do Iguaçu', en: 'Foz do Iguaçu', es: 'Foz do Iguaçu' }
})) as Tour[];

let localPosts: BlogPost[] = [];

// --- Helpers de Mapeamento e Limpeza ---

const safeNum = (val: any): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

const mapTourFromDb = (row: any): Tour => {
  return {
    ...row,
    slug: row.slug || row.id,
    fullDescription: row.full_description,
    reviewsCount: safeNum(row.reviews_count),
    pricingType: row.pricing_type || 'per_person',
    basePrice: safeNum(row.base_price),
    pricePromotional: safeNum(row.price_promotional),
    displayOrder: safeNum(row.display_order), // <--- MAPEAMENTO DA ORDEM
    vehicleTiers: Array.isArray(row.vehicle_tiers) ? row.vehicle_tiers.map((t: any) => ({
        ...t,
        price: safeNum(t.price),
        promotionalPrice: safeNum(t.promotionalPrice),
        minPax: safeNum(t.minPax),
        maxPax: safeNum(t.maxPax)
    })) : [],
    notIncluded: row.not_included,
    seasonalRules: row.seasonal_rules || [], 
    createdAt: row.created_at,
    featured: row.featured || false,
    location: row.location || { pt: '', en: '', es: '' } 
  };
};

const mapTourToDb = (tour: Partial<Tour>) => {
  const { 
      id, fullDescription, reviewsCount, pricingType, basePrice, pricePromotional,
      vehicleTiers, notIncluded, seasonalRules, createdAt, displayOrder, ...rest 
  } = tour;

  const cleanTiers = vehicleTiers?.map(t => ({
      id: t.id,
      vehicleName: t.vehicleName || 'Veículo',
      minPax: safeNum(t.minPax) || 1,
      maxPax: safeNum(t.maxPax) || 4,
      price: safeNum(t.price),
      promotionalPrice: safeNum(t.promotionalPrice)
  })) || [];

  const payload: any = {
      ...rest,
      full_description: fullDescription,
      reviews_count: safeNum(reviewsCount),
      pricing_type: pricingType,
      base_price: safeNum(basePrice),
      price_promotional: safeNum(pricePromotional),
      display_order: safeNum(displayOrder), // <--- ENVIO DA ORDEM
      vehicle_tiers: cleanTiers,
      not_included: notIncluded,
      seasonal_rules: seasonalRules,
  };
  
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return payload;
};

const mapPostFromDb = (row: any): BlogPost => ({
    ...row,
    shortDesc: row.short_desc,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at
});

const mapPostToDb = (post: Partial<BlogPost>) => {
    const { id, shortDesc, imageUrl, isActive, createdAt, ...rest } = post;
    const payload: any = {
        ...rest,
        short_desc: shortDesc,
        image_url: imageUrl,
        is_active: isActive
    };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
};

export const TourService = {
  // --- TOURS ---
  getAll: async (): Promise<Tour[]> => {
    if (supabase) {
      // ORDENAÇÃO: Primeiro pela ordem definida (display_order asc), depois pela data (mais novos primeiro)
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('display_order', { ascending: true }) // <--- ORDENAÇÃO PRINCIPAL
        .order('created_at', { ascending: false });  // <--- DESEMPATE
        
      if (error) {
         console.error("Supabase Error (GetAll):", error);
         return localTours;
      }
      return (data || []).map(mapTourFromDb);
    }
    return localTours;
  },

  getFeatured: async (): Promise<Tour[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('display_order', { ascending: true }) // <--- ORDENAÇÃO NOS DESTAQUES TAMBÉM
        .order('created_at', { ascending: false });
        
      if (error) {
         const all = await supabase.from('tours').select('*');
         return (all.data || []).map(mapTourFromDb).filter(t => t.featured);
      }
      return (data || []).map(mapTourFromDb);
    }
    return localTours.filter(t => t.featured && t.status === 'published');
  },

  getBySlug: async (slug: string): Promise<Tour | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('tours').select('*').eq('slug', slug).single();
      if (error) return undefined;
      return mapTourFromDb(data);
    }
    return localTours.find(t => t.slug === slug);
  },

  getById: async (id: string): Promise<Tour | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('tours').select('*').eq('id', id).single();
      if (error) return undefined;
      return mapTourFromDb(data);
    }
    return localTours.find(t => t.id === id);
  },

  create: async (tour: Tour): Promise<Tour> => {
    if (supabase) {
        const payload = mapTourToDb(tour);
        if (!tour.id || tour.id.length < 10) delete (payload as any).id;
        
        const { data, error } = await supabase.from('tours').insert([payload]).select().single();
        if (error) throw error;
        return mapTourFromDb(data);
    }
    const newTour = { ...tour, id: Math.random().toString(36).substr(2, 9) };
    localTours.push(newTour);
    return newTour;
  },

  update: async (id: string, updates: Partial<Tour>): Promise<Tour> => {
    if (supabase) {
      const payload = mapTourToDb(updates);
      const { data, error } = await supabase.from('tours').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return mapTourFromDb(data);
    }
    const index = localTours.findIndex(t => t.id === id);
    if (index !== -1) localTours[index] = { ...localTours[index], ...updates };
    return localTours[index];
  },

  delete: async (id: string): Promise<void> => {
    if (supabase) {
      await supabase.from('tours').delete().eq('id', id);
      return;
    }
    localTours = localTours.filter(t => t.id !== id);
  },

  // --- BLOG POSTS ---
  getAllPosts: async (): Promise<BlogPost[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('posts').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if(error) return localPosts;
      return (data || []).map(mapPostFromDb);
    }
    return localPosts;
  },
  
  getPostBySlug: async (slug: string): Promise<BlogPost | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).single();
      if (error) return undefined;
      return mapPostFromDb(data);
    }
    return localPosts.find(p => p.slug === slug);
  },

  savePost: async (post: Partial<BlogPost>): Promise<BlogPost> => {
     if(supabase) {
        const payload = mapPostToDb(post);
        if (post.id && post.id.length > 10) {
            const { data, error } = await supabase.from('posts').update(payload).eq('id', post.id).select().single();
            if(error) throw error;
            return mapPostFromDb(data);
        } else {
             delete (payload as any).id;
            const { data, error } = await supabase.from('posts').insert([payload]).select().single();
            if(error) throw error;
            return mapPostFromDb(data);
        }
     }
     return { ...post, id: 'mock' } as BlogPost;
  },

  deletePost: async (id: string): Promise<void> => {
      if(supabase) await supabase.from('posts').delete().eq('id', id);
  }
};