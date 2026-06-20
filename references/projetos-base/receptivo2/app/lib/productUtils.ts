// app/lib/productUtils.ts

import { Product } from '@/app/types';

/**
 * Formata um valor numérico para o padrão monetário brasileiro: R$ 2.455,00
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Calcula o menor preço de venda disponível dentre os pricingTiers.
 * Retorna o preço base do produto se não houver tiers.
 * Esse valor é usado como o "A partir de" exibido no card.
 */
export function calculateBasePrice(product: Product): number {
  if (product.pricingTiers && product.pricingTiers.length > 0) {
    const validPrices = product.pricingTiers
      .map((t) => t.price)
      .filter((p) => p > 0);
    if (validPrices.length > 0) {
      return Math.min(...validPrices);
    }
  }
  return product.price;
}

/**
 * Retorna o texto de avaliação no estilo Decolar/Booking.
 * Retorna null se não houver avaliação (produto novo).
 */
export function getRatingLabel(rating: number | null | undefined): string | null {
  if (rating == null) return null;
  if (rating >= 9.5) return 'Perfeito';
  if (rating >= 9) return 'Excepcional';
  if (rating >= 8) return 'Fantástico';
  if (rating >= 7) return 'Muito bom';
  if (rating >= 6) return 'Bom';
  return 'Regular';
}

/**
 * Retorna o nome legível de um aeroporto pelo código IATA.
 */
export function getAirportName(code: string): string {
  const airports: Record<string, string> = {
    IGU: 'Foz do Iguaçu (IGU)',
    IGR: 'Puerto Iguazú (IGR)',
    AGT: 'Ciudad del Este (AGT)',
    GRU: 'São Paulo – Guarulhos (GRU)',
    CGH: 'São Paulo – Congonhas (CGH)',
    GIG: 'Rio de Janeiro – Galeão (GIG)',
    SDU: 'Rio de Janeiro – Santos Dumont (SDU)',
    BSB: 'Brasília (BSB)',
    CNF: 'Belo Horizonte (CNF)',
    FOR: 'Fortaleza (FOR)',
    REC: 'Recife (REC)',
    SSA: 'Salvador (SSA)',
    POA: 'Porto Alegre (POA)',
    FLN: 'Florianópolis (FLN)',
    CWB: 'Curitiba (CWB)',
  };
  return airports[code] ?? code;
}

/**
 * Lista de aeroportos regionais disponíveis para seleção nos Wizards e na Busca.
 */
export const REGIONAL_AIRPORTS = [
  { code: 'IGU', label: 'IGU — Foz do Iguaçu, BR' },
  { code: 'IGR', label: 'IGR — Puerto Iguazú, AR' },
  { code: 'AGT', label: 'AGT — Ciudad del Este, PY' },
];

/**
 * Verifica se um produto de transfer atende a um par de origem/destino.
 * Usado na página de busca pública.
 */
export function transferMatchesRoute(
  product: Product,
  originCode: string,
  destinationQuery: string,
): boolean {
  const routes = product.transferDetails?.routes;

  if (!routes || routes.length === 0) {
    // Fallback legacy: usa airportCode e city
    const legacyAirport = product.transferDetails?.airportCode?.toUpperCase();
    const legacyCity = (product.transferDetails?.city || '').toLowerCase();
    const matchOrigin = !originCode || legacyAirport === originCode.toUpperCase();
    const matchDest =
      !destinationQuery ||
      legacyCity.includes(destinationQuery.toLowerCase());
    return matchOrigin && matchDest;
  }

  return routes.some((route) => {
    const matchOrigin =
      !originCode ||
      route.originCode?.toUpperCase() === originCode.toUpperCase() ||
      route.originName.toLowerCase().includes(originCode.toLowerCase());

    const matchDest =
      !destinationQuery ||
      route.destinationName.toLowerCase().includes(destinationQuery.toLowerCase()) ||
      (route.destinationZoneId || '').toLowerCase().includes(destinationQuery.toLowerCase());

    return matchOrigin && matchDest;
  });
}
