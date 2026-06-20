// components/Admin/wizards/schemas.ts
import { z } from 'zod';

// --- Schema do Tour / Passeio ---

export const tourSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  location: z.string().optional(),
  duration: z.string().min(1, 'Informe a duração'),
  guideLanguages: z.array(z.string()).optional(),
  meetingPoint: z.string().optional(),

  features: z.array(z.string()),
  notIncluded: z.array(z.string()),
  tags: z.array(z.string()),
  itinerary: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        time: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .optional(),

  imageUrl: z.string().min(1, 'Imagem de capa é obrigatória'),
  gallery: z.array(z.string()).optional(),

  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  pricingTiers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        costPrice: z.number().optional(),
      }),
    )
    .optional(),

  is_free_cancellation: z.boolean().optional(),
  cancellationPolicy: z.string().optional(),
  importantInfo: z.string().optional(),

  rating: z.number().min(0).max(10).nullable().optional(),
  reviewsCount: z.number().min(0).nullable().optional(),

  active: z.boolean(),
  isFeatured: z.boolean(),
  isFixedTime: z.boolean(),
  capacityPerSlot: z.number().optional(),
});

export type TourFormData = z.infer<typeof tourSchema>;

// --- Schema do Transfer Aeroporto ---

export const transferRouteSchema = z.object({
  id: z.string(),
  originType: z.enum(['airport', 'hotel', 'landmark', 'city']),
  originName: z.string().min(1, 'Nome da origem é obrigatório'),
  originCode: z.string().optional(),
  destinationType: z.enum(['airport', 'hotel', 'landmark', 'city', 'zone']),
  destinationName: z.string().min(1, 'Nome do destino é obrigatório'),
  destinationZoneId: z.string().optional(),
  priceOverride: z.number().optional(),
});

export const airportTransferSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  supplierId: z.string().optional(),

  // Logística
  airportCode: z.string().min(2, 'Selecione o aeroporto'),
  routeType: z.enum(['airport_to_hotel', 'hotel_to_airport', 'round_trip']),
  supportsRoundtrip: z.boolean(),
  roundtripDiscountPercent: z.number().min(0).max(100).optional(),
  routes: z.array(transferRouteSchema).optional(),

  // Veículo
  serviceType: z.enum(['private', 'shared']),
  pricingModel: z.enum(['per_vehicle', 'per_person']),
  vehicleModel: z.string().min(1, 'Categoria do veículo é obrigatória'),
  passengerCapacity: z.number().min(1, 'Informe a capacidade de passageiros'),
  luggageCapacity: z.number().min(0),
  handLuggageCapacity: z.number().optional(),
  requiresFlightNumber: z.boolean(),
  meetingPointInstructions: z.string().optional(),
  waitingTime: z.string().optional(),

  // Mídia
  imageUrl: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  features: z.array(z.string()),

  // Precificação
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  pricingTiers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        costPrice: z.number().optional(),
      }),
    )
    .optional(),

  is_free_cancellation: z.boolean(),

  rating: z.number().min(0).max(10).nullable().optional(),
  reviewsCount: z.number().min(0).nullable().optional(),

  active: z.boolean(),
  isFeatured: z.boolean(),
});

export type AirportTransferFormData = z.infer<typeof airportTransferSchema>;
export type TransferRouteFormData = z.infer<typeof transferRouteSchema>;
