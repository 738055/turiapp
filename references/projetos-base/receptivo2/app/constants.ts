import { Product, Booking, Language, WeatherData, Banner, BlogPost, ContentPage, Category } from './types';

// --- Translations ---
export const TRANSLATIONS: Record<Language, any> = {
  pt: {
    searchPlaceholder: 'Busque aqui o que você precisa...',
    searchBtn: 'Buscar',
    date: 'Data',
    heroTitle: 'Descubra a Magia das Águas',
    heroSubtitle: 'As melhores experiências em Foz do Iguaçu',
    featuredTitle: 'Destaques em Foz',
    from: 'A partir de',
    buyNow: 'Comprar Agora',
    about: 'Sobre a experiência',
    itinerary: 'Roteiro',
    reviews: 'Avaliações',
    bookTitle: 'Garanta seu lugar',
    adults: 'Adultos',
    children: 'Crianças',
    total: 'Total',
    checkout: 'Ir para Pagamento',
    footerAbout: 'Sua agência receptiva oficial em Foz do Iguaçu. Experiências únicas nas Cataratas e região.',
    blogTitle: 'Dicas da Fronteira',
    weather: 'Clima em Foz',
    tide: 'Vazão'
  },
  en: {
    searchPlaceholder: 'Search for tours, tickets...',
    searchBtn: 'Search',
    date: 'Date',
    heroTitle: 'Discover the Magic of the Waters',
    heroSubtitle: 'The best experiences in Foz do Iguaçu',
    featuredTitle: 'Highlights in Foz',
    from: 'From',
    buyNow: 'Book Now',
    about: 'About',
    itinerary: 'Itinerary',
    reviews: 'Reviews',
    bookTitle: 'Book your spot',
    adults: 'Adults',
    children: 'Children',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    footerAbout: 'Your official receptive agency in Foz do Iguaçu.',
    blogTitle: 'Border Tips',
    weather: 'Weather in Foz',
    tide: 'Flow'
  },
  es: {
    searchPlaceholder: 'Busca aquí lo que necesitas...',
    searchBtn: 'Buscar',
    date: 'Fecha',
    heroTitle: 'Descubre la Magia de las Aguas',
    heroSubtitle: 'Las mejores experiencias en Foz de Iguazú',
    featuredTitle: 'Destacados en Foz',
    from: 'A partir de',
    buyNow: 'Comprar Ahora',
    about: 'Sobre',
    itinerary: 'Itinerario',
    reviews: 'Evaluaciones',
    bookTitle: 'Reserva tu lugar',
    adults: 'Adultos',
    children: 'Niños',
    total: 'Total',
    checkout: 'Ir a Pagar',
    footerAbout: 'Tu agencia receptiva oficial en Foz de Iguazú.',
    blogTitle: 'Consejos de la Frontera',
    weather: 'Clima en Foz',
    tide: 'Caudal'
  }
};

// --- Mock Data ---

export const CURRENT_WEATHER: WeatherData = {
  temp: 28,
  condition: 'Ensolarado',
  tide: 'Normal (1.500m³/s)'
};

// INITIAL CATEGORIES (Dynamic Menu)
export const INITIAL_CATEGORIES: Category[] = [
   { id: '1', label: 'Transfers', slug: 'transfers', icon: 'Plane', active: true, order: 1 },
   { id: '2', label: 'Ingressos', slug: 'ingressos', icon: 'Ticket', active: true, order: 2 },
   { id: '3', label: 'Gastronomia', slug: 'gastronomia', icon: 'Utensils', active: true, order: 3 },
   { id: '4', label: 'Compras', slug: 'compras', icon: 'ShoppingBag', active: true, order: 4 },
   { id: '5', label: 'Combos', slug: 'combos', icon: 'Layers', active: true, order: 5 },
   { id: '6', label: 'Passeios', slug: 'passeios', icon: 'Camera', active: true, order: 6 },
   { id: '7', label: 'Blog', slug: 'blog', icon: 'Newspaper', active: true, order: 7 },
];

// INITIAL BANNERS
export const INITIAL_BANNERS: Banner[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/id/1039/1920/600',
    title: 'CATARATAS DO IGUAÇU',
    subtitle: 'SINTA A ENERGIA DAS ÁGUAS EM UMA EXPERIÊNCIA ÚNICA',
    buttonText: 'GARANTA SEU INGRESSO',
    link: '/tours/cataratas-brasileiras',
    align: 'left',
    active: true,
    order: 1
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/id/292/1920/600',
    title: 'COMPRAS NO PARAGUAI',
    subtitle: 'TRANSPORTE SEGURO E CONFORTÁVEL PARA SUAS COMPRAS',
    buttonText: 'RESERVAR TRANSFER',
    link: '/tours/compras-paraguai',
    align: 'center',
    active: true,
    order: 2
  }
];

// INITIAL BLOG POSTS (SEO Optimized Data)
export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'compras-paraguai-2024',
    title: 'Compras no Paraguai: Guia Completo e Atualizado 2024',
    imageUrl: 'https://picsum.photos/id/10/400/250',
    date: '20 Out 2023',
    excerpt: 'Saiba quais são as melhores lojas, cotas de isenção e dicas de segurança para suas compras em Ciudad del Este.',
    content: '<p>Ciudad del Este é o paraíso das compras...</p>',
    author: 'Equipe Reserva',
    active: true,
    metaDescription: 'Guia definitivo de compras no Paraguai em 2024. Melhores lojas, cota e segurança.',
    keywords: ['compras paraguai', 'ciudad del este', 'iphone barato', 'cota paraguai']
  },
  {
    id: '2',
    slug: 'onde-comer-puerto-iguazu',
    title: 'Gastronomia na Fronteira: Onde comer em Puerto Iguazú',
    imageUrl: 'https://picsum.photos/id/20/400/250',
    date: '15 Out 2023',
    excerpt: 'Descubra a gastronomia argentina, os melhores bifes de chorizo e vinhos da fronteira.',
    content: '<p>A Argentina é famosa por suas carnes...</p>',
    author: 'Equipe Reserva',
    active: true,
    metaDescription: 'Descubra os melhores restaurantes de Puerto Iguazú. Carnes nobres e vinhos argentinos.',
    keywords: ['restaurantes puerto iguazu', 'bife de chorizo', 'jantar argentina']
  },
  {
    id: '3',
    slug: 'macuco-safari-vale-a-pena',
    title: 'Macuco Safari: Vale a pena o passeio de barco?',
    imageUrl: 'https://picsum.photos/id/30/400/250',
    date: '10 Out 2023',
    excerpt: 'Tudo sobre o passeio de barco mais emocionante das Cataratas. Preços, dicas e o que levar.',
    content: '<p>Se molhar é garantido...</p>',
    author: 'Equipe Reserva',
    active: true,
    metaDescription: 'Review completa do Macuco Safari nas Cataratas do Iguaçu. Vale o preço? O que inclui?',
    keywords: ['macuco safari', 'passeio de barco cataratas', 'aventura foz']
  }
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'cataratas-brasileiras',
    name: 'Ingresso Cataratas do Iguaçu + Transporte',
    type: 'tour',
    category: 'Passeios',
    location: 'Foz do Iguaçu, BR',
    price: 180.00,
    rating: 5.0,
    reviewsCount: 2450,
    imageUrl: 'https://picsum.photos/id/1039/800/600', 
    description: 'Visite uma das 7 Maravilhas da Natureza com conforto e guia especializado. Inclui transporte ida e volta do seu hotel.',
    duration: '4 horas',
    tags: ['Imperdível', 'Natureza'],
    features: ['Transporte Climatizado', 'Guia Bilíngue', 'Entrada Expressa'],
    extras: [
       { id: '1', name: 'Almoço Porto Canoas', price: 98.00, type: 'per_person' },
       { id: '2', name: 'Capa de Chuva', price: 15.00, type: 'fixed' }
    ],
    itinerary: [
      { time: '08:30', title: 'Pick-up', description: 'Buscamos nos hotéis do centro.', icon: 'bus' },
      { time: '09:30', title: 'Chegada ao Parque', description: 'Acesso facilitado ao Centro de Visitantes.', icon: 'map' },
      { time: '10:00', title: 'Trilha das Cataratas', description: 'Caminhada panorâmica com vista para os saltos.', icon: 'camera' }
    ],
    isFeatured: true
  },
  {
    id: 't1',
    slug: 'transfer-in-igu-privado',
    name: 'Privativo - Aeroporto Foz (IGU) para Hotel',
    type: 'transfer',
    category: 'Transfers',
    location: 'Foz do Iguaçu, BR',
    price: 89.00,
    rating: 4.9,
    reviewsCount: 320,
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    description: 'Recepção no Aeroporto de Foz do Iguaçu com placa nominal e transporte privativo (Sedan Executivo) até seu hotel.',
    duration: '40 min',
    tags: ['Privativo', 'Aeroporto'],
    features: ['Recepção no Desembarque', 'Ar Condicionado', 'Porta-malas'],
    transferDetails: {
       transferCategory: 'airport',
       routeType: 'airport_to_hotel',
       serviceType: 'private',
       pricingModel: 'per_vehicle',
       airportCode: 'IGU',
       vehicleModel: 'Sedan Executivo',
       passengerCapacity: 4,
       luggageCapacity: 2,
       handLuggageCapacity: 2
    },
    isFeatured: true
  },
  {
    id: 't2',
    slug: 'transfer-out-igu-privado',
    name: 'Privativo - Hotel para Aeroporto Foz (IGU)',
    type: 'transfer',
    category: 'Transfers',
    location: 'Foz do Iguaçu, BR',
    price: 89.00,
    rating: 4.9,
    reviewsCount: 280,
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    description: 'Buscamos em seu hotel com pontualidade para levá-lo ao Aeroporto de Foz do Iguaçu.',
    duration: '40 min',
    tags: ['Privativo', 'Aeroporto'],
    features: ['Pontualidade', 'Ar Condicionado'],
    transferDetails: {
       transferCategory: 'airport',
       routeType: 'hotel_to_airport',
       serviceType: 'private',
       pricingModel: 'per_vehicle',
       airportCode: 'IGU',
       vehicleModel: 'Sedan Executivo',
       passengerCapacity: 4,
       luggageCapacity: 2,
       handLuggageCapacity: 2
    },
    isFeatured: true
  },
  {
    id: 't3',
    slug: 'transfer-in-igu-shared',
    name: 'Compartilhado - Aeroporto Foz (IGU) para Hotel',
    type: 'transfer',
    category: 'Transfers',
    location: 'Foz do Iguaçu, BR',
    price: 35.00,
    rating: 4.5,
    reviewsCount: 150,
    imageUrl: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&q=80&w=800',
    description: 'Opção econômica em Van climatizada. Pode haver espera máxima de 30min no aeroporto.',
    duration: '60 min',
    tags: ['Econômico', 'Compartilhado'],
    features: ['Ar Condicionado', 'Wi-Fi'],
    transferDetails: {
       transferCategory: 'airport',
       routeType: 'airport_to_hotel',
       serviceType: 'shared',
       pricingModel: 'per_person',
       airportCode: 'IGU',
       vehicleModel: 'Van Mercedes Sprinter',
       passengerCapacity: 15,
       luggageCapacity: 1,
       handLuggageCapacity: 1
    },
    isFeatured: true
  },
  {
    id: '3',
    slug: 'compras-paraguai',
    name: 'Tour de Compras no Paraguai',
    type: 'tour',
    category: 'Compras',
    location: 'Ciudad del Este, PY',
    price: 80.00,
    rating: 4.6,
    reviewsCount: 520,
    imageUrl: 'https://picsum.photos/id/201/800/600', 
    description: 'Transporte seguro e confortável para suas compras em Ciudad del Este. Dicas das melhores lojas.',
    duration: '6 horas',
    tags: ['Compras', 'Transporte'],
    features: ['Ar Condicionado', 'Dicas de Lojas', 'Seguro Passageiro'],
    itinerary: [
       { title: 'Manhã', description: 'Tempo livre para compras nas principais lojas (Cellshop, Monalisa).', icon: 'map' }
    ],
    isFeatured: true
  }
];

export const RECENT_BOOKINGS: Booking[] = [
  { id: '1001', customerName: 'João Silva', date: '2023-10-25', productName: 'Cataratas + Almoço', total: 556.00, status: 'confirmed', paymentMethod: 'credit_card' },
  { id: '1002', customerName: 'Maria Garcia', date: '2023-10-26', productName: 'Itaipu Visita', total: 116.00, status: 'pending', paymentMethod: 'pix' },
  { id: '1003', customerName: 'Pedro Almodovar', date: '2023-10-26', productName: 'Macuco Safari', total: 1540.00, status: 'confirmed', paymentMethod: 'boleto' },
];

export const SALES_DATA = [
  { name: 'Jan', sales: 4000 },
  { name: 'Fev', sales: 3000 },
  { name: 'Mar', sales: 2000 },
  { name: 'Abr', sales: 2780 },
  { name: 'Mai', sales: 1890 },
  { name: 'Jun', sales: 2390 },
  { name: 'Jul', sales: 3490 },
];