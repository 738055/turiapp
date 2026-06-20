// app/types.ts

// --- Tipos Auxiliares ---

export interface LocalizedString {
  pt: string;
  en: string;
  es: string;
}

export interface ExtraOption {
  id?: string;
  name: string;
  price: number;
  type: 'per_person' | 'fixed';
}

// --- Trechos (Rotas) de Transfer ---

export interface TransferRoute {
  id: string;
  originType: 'airport' | 'hotel' | 'landmark' | 'city';
  originName: string;
  originCode?: string; // Código IATA: IGU, IGR, AGT
  destinationType: 'airport' | 'hotel' | 'landmark' | 'city' | 'zone';
  destinationName: string;
  destinationZoneId?: string; // Referência a uma zona hoteleira
  priceOverride?: number; // Preço específico para este trecho
}

export interface TransferZone {
  id: string;
  name: string; // Ex: "Zona Hoteleira Central", "Beira-Rio"
  description?: string;
  priceMultiplier?: number; // Ex: 1.2 = 20% a mais
  basePriceOverride?: number; // Preço fixo para esta zona
}

// --- Detalhes de Transfer (Atualizado) ---

export interface TransferDetails {
  serviceType: 'private' | 'shared';
  pricingModel: 'per_vehicle' | 'per_person';
  vehicleModel: string;
  passengerCapacity: number;
  luggageCapacity: number;
  handLuggageCapacity?: number;

  // Logística
  meetingPointInstructions?: string;
  waitingTime?: string;

  // Trechos Estruturados (NOVO)
  routes?: TransferRoute[];
  zones?: TransferZone[];

  // Suporte a Ida e Volta (NOVO)
  supportsRoundtrip?: boolean;
  roundtripDiscountPercent?: number;

  // Número do Voo (NOVO)
  requiresFlightNumber?: boolean;

  // Legacy — compatibilidade
  supportedRoutes?: { origin: string; destination: string }[];
  transferCategory?: 'airport' | 'tour';
  airportCode?: string;
  city?: string;
  routeType?: 'airport_to_hotel' | 'hotel_to_airport' | 'round_trip';
}

// --- Itinerário ---

export interface ItineraryItem {
  time?: string;
  title: string;
  description: string;
  icon?: string;
}

// --- Variações de Preço ---

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  mode?: 'per_person' | 'per_vehicle';
}

// --- Interfaces da Aplicação (Frontend) ---

export interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string;
  order: number;
  active: boolean;
  description?: string;
}

export interface Product {
  id: string;
  slug: string;

  // Dados Principais
  name: string;
  name_localized?: LocalizedString;
  description: string;
  description_localized?: LocalizedString;
  shortDescription?: string;

  // Financeiro
  price: number;
  compareAtPrice?: number;
  costPrice?: number;

  // Imagens
  imageUrl: string;
  gallery?: string[];

  // Relacionamentos
  category: string;
  categoryId?: string;
  supplierId?: string;

  type: 'tour' | 'transfer' | 'ticket' | 'gastronomy' | 'package';

  location?: string;
  duration?: string;
  isFixedTime?: boolean;
  capacityPerSlot?: number;

  // UI
  isFeatured?: boolean;
  // null = Sem avaliações ainda (exibe 0.0 com estrelas vazias)
  rating?: number | null;
  reviewsCount?: number | null;
  active?: boolean;

  // Cancelamento — campo booleano real (substitui string check)
  is_free_cancellation?: boolean;

  // Idiomas do Guia (Tours)
  guideLanguages?: string[];

  // Metadados Avançados
  features?: string[];
  tags?: string[];
  extras?: ExtraOption[];
  transferDetails?: TransferDetails;
  itinerary?: ItineraryItem[];
  notIncluded?: string[];
  cancellationPolicy?: string;
  importantInfo?: string;
  pricingTiers?: PricingTier[];
  metadata?: any;
}

// --- Carrinho ---

export interface CartItem {
  internalId: string;
  product: Product;

  date: string;
  time?: string;
  adults: number;
  children: number;
  selectedExtras: Record<string, number>;
  selectedTiers?: Record<string, number>;

  quantity: number;
  price: number;
  subtotal: number;
}

// --- Interfaces do ERP ---

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  pixKey?: string;
  bankDetails?: string;
  active: boolean;
}

export interface AvailabilitySlot {
  id: string;
  productId: string;
  date: string;
  time?: string;
  totalSlots: number;
  usedSlots: number;
  blocked: boolean;
}

export interface PassengerDetail {
  name: string;
  document: string;
  age?: number;
  isChild?: boolean;
}

export interface Booking {
  id: string;
  date: string;
  tourDate?: string;

  customerName: string;
  customerEmail?: string;
  customerWhatsapp?: string;
  customerDocument?: string;

  productName: string;
  productId?: string;

  quantity?: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'paid' | 'completed' | 'remarketing_sent';
  paymentMethod: string;

  pickupLocation?: string;
  flightInfo?: string;
  passengers?: PassengerDetail[];
  notes?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  status: 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  paymentDate?: string;
  bookingId?: string;
  supplierId?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  author: string;
  active: boolean;
  metaDescription?: string;
  keywords?: string[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  link?: string;
  align: 'left' | 'center' | 'right';
  active: boolean;
  order: number;
}

// --- Interfaces do Banco de Dados (Supabase Raw) ---

export interface DatabaseProduct {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;

  cost_price: number | null;
  supplier_id: string | null;
  is_fixed_time: boolean;
  capacity_per_slot: number | null;

  images: string[] | null;
  category_id: string | null;
  location: string | null;
  duration: string | null;
  featured: boolean;
  rating: number | null;
  reviews_count: number | null;
  availability: boolean;

  metadata: {
    type?: 'tour' | 'transfer' | 'ticket' | 'gastronomy' | 'package';
    name_localized?: LocalizedString;
    description_localized?: LocalizedString;
    transferDetails?: TransferDetails;
    pricingTiers?: PricingTier[];
    extras?: ExtraOption[];
    features?: string[];
    tags?: string[];
    active?: boolean;
    itinerary?: ItineraryItem[];
    notIncluded?: string[];
    cancellationPolicy?: string;
    importantInfo?: string;
    is_free_cancellation?: boolean;
    guideLanguages?: string[];
  };

  created_at: string;
  updated_at: string;
}

export interface DatabaseCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  description: string | null;
  order: number;
  active: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxUses?: number;
  usedCount: number;
  expirationDate?: string;
  active: boolean;
}

// --- Sistema de Ordens de Serviço (OS) ---

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverGuide {
  id: string;
  name: string;
  phone?: string;
  languages_spoken: string[];
  type: 'guide' | 'driver' | 'both';
  document_number?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOrder {
  id: string;
  os_number: string;
  agency_name?: string;
  reference_code?: string;
  lead_passenger_name: string;
  pax_count: number;
  children_count: number;
  date_in: string;
  date_out: string;
  hotel_name?: string;
  assigned_guide_id?: string;
  assigned_guide?: DriverGuide;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  items?: ServiceOrderItem[];
  passengers?: OSPassenger[];
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  date: string;
  time?: string;
  service_type: 'transfer_in' | 'transfer_out' | 'tour' | 'excursion' | 'other';
  description: string;
  flight_number?: string;
  flight_time?: string;
  airline_locator?: string;
  pick_up?: string;
  drop_off?: string;
  assigned_vehicle_id?: string;
  assigned_vehicle?: Vehicle;
  sort_order?: number;
  notes?: string;
  created_at?: string;
}

export interface OSPassenger {
  id: string;
  service_order_id: string;
  name: string;
  birthdate?: string;
  nationality?: string;
  document_type?: 'passport' | 'rg' | 'dni' | 'other';
  document_number?: string;
  gender?: 'M' | 'F';
  is_lead?: boolean;
  sort_order?: number;
  created_at?: string;
}

// --- Globais ---

export type Language = 'pt' | 'en' | 'es';

export interface WeatherData {
  temp: number;
  condition: string;
  tide?: string;
  icon?: string;
  humidity?: number;
  windSpeed?: number;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}
