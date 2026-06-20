'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { PublicLayout } from '@/components/Layout/PublicLayout';
import {
  Plane, Calendar, Users, Search, Check, X, Luggage, ShieldCheck,
  User, ArrowRightLeft, MapPin,
} from 'lucide-react';
import { useContent } from '@/app/contexts/ContentContext';
import { useCart } from '@/app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Product } from '@/app/types';
import { calculateBasePrice, transferMatchesRoute, REGIONAL_AIRPORTS } from '@/app/lib/productUtils';

// Destinos/zonas hoteleiras para seleção no formulário de busca
const DESTINATION_OPTIONS = [
  { value: '', label: 'Todos os destinos' },
  { value: 'foz', label: 'Hotéis em Foz do Iguaçu, BR' },
  { value: 'puerto', label: 'Puerto Iguazú, AR' },
  { value: 'ciudad', label: 'Ciudad del Este, PY' },
  { value: 'cataratas', label: 'Hotel das Cataratas / Área do Parque' },
  { value: 'centro', label: 'Centro de Foz do Iguaçu' },
  { value: 'beira-rio', label: 'Zona Beira-Rio' },
];

export default function TransferSearchPage() {
  const { products } = useContent();
  const { addToCart } = useCart();
  const router = useRouter();

  const transfers = useMemo(
    () => products.filter((p) => p.type === 'transfer' && p.active),
    [products],
  );

  // Search State
  const [roundtrip, setRoundtrip] = useState(false);
  const [searchParams, setSearchParams] = useState({
    originAirport: 'IGU',
    destination: '',
    date: '',
    time: '12:00',
    returnDate: '',
    pax: 1,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'private' | 'shared'>('all');

  // Modal de Reserva
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Product | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    flightNumber: '',
    flightTime: '',
    returnFlightNumber: '',
    returnFlightTime: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  // Filtragem usando a nova lógica de Trechos
  const filteredTransfers = useMemo(() => {
    let result = [...transfers];

    // Filtro por Rota (Origem + Destino)
    if (hasSearched && (searchParams.originAirport || searchParams.destination)) {
      result = result.filter((t) =>
        transferMatchesRoute(t, searchParams.originAirport, searchParams.destination),
      );
    }

    // Filtro por Capacidade de Passageiros
    result = result.filter((t) => {
      const cap = t.transferDetails?.passengerCapacity ?? 99;
      return cap >= searchParams.pax;
    });

    // Filtro por Tipo (Privativo/Compartilhado)
    if (filterType !== 'all') {
      result = result.filter((t) => t.transferDetails?.serviceType === filterType);
    }

    // Ordena pelo menor preço
    result.sort((a, b) => calculateBasePrice(a) - calculateBasePrice(b));

    return result;
  }, [transfers, hasSearched, searchParams, filterType]);

  const openBookingModal = (transfer: Product) => {
    if (!searchParams.date) { alert('Selecione a data da ida.'); return; }
    if (roundtrip && !searchParams.returnDate) { alert('Selecione a data da volta.'); return; }
    setSelectedTransfer(transfer);
    setBookingDetails((prev) => ({ ...prev, flightTime: searchParams.time }));
    setIsModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedTransfer) return;
    if (!bookingDetails.flightNumber || !bookingDetails.flightTime) {
      alert('Informe os dados do voo.');
      return;
    }

    const productToAdd = { ...selectedTransfer };
    const basePrice = calculateBasePrice(productToAdd);

    // Aplica multiplicador de roundtrip e desconto configurado
    if (roundtrip) {
      const discountPct = productToAdd.transferDetails?.roundtripDiscountPercent ?? 0;
      const returnMultiplier = 1 + (1 - discountPct / 100);
      productToAdd.price = basePrice * returnMultiplier;
      productToAdd.name = `${productToAdd.name} (Ida e Volta)`;
    } else {
      productToAdd.price = basePrice;
    }

    addToCart(productToAdd, searchParams.date, searchParams.pax, 0, {});
    setIsModalOpen(false);
    router.push('/checkout');
  };

  // Calcula preço exibido por card na listagem
  const getDisplayPrice = (transfer: Product): number => {
    const base = calculateBasePrice(transfer);
    const isPerVehicle = transfer.transferDetails?.pricingModel === 'per_vehicle';
    let price = isPerVehicle ? base : base * searchParams.pax;
    if (roundtrip) {
      const discountPct = transfer.transferDetails?.roundtripDiscountPercent ?? 0;
      price = price * (1 + (1 - discountPct / 100));
    }
    return price;
  };

  return (
    <PublicLayout>
      {/* Cabeçalho de Busca */}
      <div className="bg-secondary pt-8 pb-32 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
            <Plane size={28} /> Transfers e receptivo
          </h1>

          <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl text-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Aeroporto de Origem */}
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Aeroporto de Origem
                </label>
                <select
                  className="w-full font-bold p-2.5 border rounded-lg outline-none bg-white"
                  value={searchParams.originAirport}
                  onChange={(e) => setSearchParams({ ...searchParams, originAirport: e.target.value })}
                >
                  <option value="">Qualquer aeroporto</option>
                  {REGIONAL_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Destino */}
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Destino / Zona Hoteleira
                </label>
                <select
                  className="w-full font-bold p-2.5 border rounded-lg outline-none bg-white"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                >
                  {DESTINATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Data do Transfer
                </label>
                <input
                  type="date"
                  className="w-full font-bold p-2.5 border rounded-lg outline-none"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                />
              </div>

              {/* Passageiros */}
              <div className="w-32">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Passageiros
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full font-bold p-2.5 border rounded-lg outline-none"
                  value={searchParams.pax}
                  onChange={(e) => setSearchParams({ ...searchParams, pax: Number(e.target.value) })}
                />
              </div>

              <button
                type="submit"
                className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-lg flex items-center justify-center gap-2 self-end"
              >
                <Search size={20} /> Buscar
              </button>
            </div>

            {/* Ida e Volta */}
            <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary-600"
                  checked={roundtrip}
                  onChange={(e) => setRoundtrip(e.target.checked)}
                />
                <span className="font-medium text-sm flex items-center gap-1">
                  <ArrowRightLeft size={14} /> Ida e Volta
                </span>
              </label>

              {roundtrip && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Data da Volta</label>
                  <input
                    type="date"
                    className="text-gray-800 border px-2 py-1.5 rounded-lg text-sm"
                    value={searchParams.returnDate}
                    onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                  />
                </div>
              )}

              {/* Filtro Tipo */}
              {hasSearched && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Serviço:</span>
                  {(['all', 'private', 'shared'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        filterType === type
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {type === 'all' ? 'Todos' : type === 'private' ? 'Privativo' : 'Compartilhado'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Resultados */}
      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        {/* REMOVEMOS O BLOCO !hasSearched QUE ESCONDIA TUDO */}
        <div className="space-y-6">
          {/* Cabeçalho dos Resultados */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>{filteredTransfers.length}</strong> opção{filteredTransfers.length !== 1 ? 'ões' : ''} encontrada{filteredTransfers.length !== 1 ? 's' : ''}
              {roundtrip && <span className="ml-2 bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full text-xs font-bold">Ida e Volta</span>}
            </p>
            {hasSearched && searchParams.originAirport && (
              <p className="text-xs text-gray-400">
                {REGIONAL_AIRPORTS.find((a) => a.code === searchParams.originAirport)?.label ?? searchParams.originAirport}
                {searchParams.destination && ` → ${DESTINATION_OPTIONS.find((d) => d.value === searchParams.destination)?.label ?? searchParams.destination}`}
              </p>
            )}
          </div>

          {filteredTransfers.length === 0 ? (
            <div className="bg-white p-10 rounded-xl text-center shadow border border-gray-100">
              <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-4">
                <Plane size={32} />
              </div>
              <p className="text-gray-600 font-bold mb-2">
                Nenhum veículo encontrado para essa combinação.
              </p>
              <p className="text-gray-400 text-sm">
                Tente ajustar a origem, o destino ou o número de passageiros na busca acima.
              </p>
            </div>
          ) : (
            filteredTransfers.map((transfer) => {
                const isPrivate = transfer.transferDetails?.serviceType === 'private';
                const isPerVehicle = transfer.transferDetails?.pricingModel === 'per_vehicle';
                const finalPrice = getDisplayPrice(transfer);
                const supportsRoundtrip = transfer.transferDetails?.supportsRoundtrip;
                const firstRoute = transfer.transferDetails?.routes?.[0];

                return (
                  <div
                    key={transfer.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row group"
                  >
                    {/* Imagem e Badges */}
                    <div className="relative w-full md:w-64 bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 shrink-0 min-h-[140px]">
                      {transfer.imageUrl ? (
                        <Image
                          src={transfer.imageUrl}
                          alt={transfer.name}
                          fill
                          sizes="256px"
                          className="object-contain p-4 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-gray-200"><Plane size={64} /></div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase text-white shadow ${isPrivate ? 'bg-primary-600' : 'bg-primary-500'}`}
                        >
                          {isPrivate ? 'Privativo' : 'Compartilhado'}
                        </span>
                        {supportsRoundtrip && (
                          <span className="bg-accent text-white px-2 py-1 rounded text-[10px] font-bold shadow flex items-center gap-1">
                            <ArrowRightLeft size={9} /> Ida e Volta
                          </span>
                        )}
                        {transfer.tags?.map((tag, i) => (
                          <span key={i} className="bg-white/90 text-gray-800 px-2 py-1 rounded text-[10px] font-bold shadow">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Informações do Veículo */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{transfer.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">{transfer.transferDetails?.vehicleModel || 'Veículo Padrão'}</p>

                        {/* Rota do Trecho */}
                        {firstRoute && (
                          <p className="text-xs text-accent-dark font-medium mb-3 flex items-center gap-1">
                            <MapPin size={11} />
                            {firstRoute.originCode ? `${firstRoute.originCode} — ` : ''}{firstRoute.originName}
                            {' → '}
                            {firstRoute.destinationName}
                          </p>
                        )}

                        {/* Capacidades */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <User size={14} className="text-primary-600" />
                            Até {transfer.transferDetails?.passengerCapacity} pax
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <Luggage size={14} className="text-primary-600" />
                            {transfer.transferDetails?.luggageCapacity} mala{(transfer.transferDetails?.luggageCapacity ?? 0) !== 1 ? 's' : ''}
                          </div>
                          {transfer.transferDetails?.handLuggageCapacity != null && (
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                              <Luggage size={12} className="text-gray-400" />
                              {transfer.transferDetails.handLuggageCapacity} mão
                            </div>
                          )}
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <ShieldCheck size={14} className="text-success" /> Seguro incluso
                          </div>
                        </div>

                        {/* Diferenciais */}
                        {transfer.features && transfer.features.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {transfer.features.map((feat, i) => (
                              <span
                                key={i}
                                className="text-xs text-primary-800 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded flex items-center gap-1"
                              >
                                <Check size={12} /> {feat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {transfer.is_free_cancellation && (
                        <p className="text-xs text-success font-medium mt-3 flex items-center gap-1">
                          <Check size={12} strokeWidth={3} /> Cancelamento gratuito
                        </p>
                      )}
                    </div>

                    {/* Preço e Ação */}
                    <div className="w-full md:w-56 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-5 flex flex-col justify-center items-end text-right">
                      <span className="text-[11px] font-bold text-gray-400 uppercase mb-1">
                        {isPerVehicle
                          ? `Preço do veículo`
                          : `Para ${searchParams.pax} passageiro${searchParams.pax !== 1 ? 's' : ''}`}
                      </span>

                      {roundtrip && (
                        <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded font-bold mb-2">
                          Ida e Volta inclusa
                        </span>
                      )}

                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-sm font-semibold text-gray-500">R$</span>
                        <span className="text-2xl font-bold text-secondary">{finalPrice.toFixed(0)}</span>
                      </div>

                      <span className="text-[10px] text-gray-500 mb-4">
                        {isPerVehicle ? 'Preço total do veículo' : 'Por passageiro'}
                      </span>

                      <button
                        onClick={() => openBookingModal(transfer)}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Modal de Reserva */}
      {isModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-secondary p-4 flex justify-between text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Plane size={20} /> Dados do voo
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 bg-primary-50 p-3 rounded-lg border border-primary-100">
                Para o veículo <strong>{selectedTransfer.name}</strong>, informe os dados do voo para que o motorista monitore a chegada.
              </p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-sm text-gray-800 mb-3">Voo de Ida — {searchParams.date}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nº do Voo (Ex: LA3034)"
                    className="border p-2 rounded uppercase text-sm"
                    value={bookingDetails.flightNumber}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, flightNumber: e.target.value })}
                  />
                  <input
                    type="time"
                    className="border p-2 rounded text-sm"
                    value={bookingDetails.flightTime}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, flightTime: e.target.value })}
                  />
                </div>
              </div>

              {roundtrip && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-sm text-gray-800 mb-3">Voo de Volta — {searchParams.returnDate}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nº do Voo (Ex: G31020)"
                      className="border p-2 rounded uppercase text-sm"
                      value={bookingDetails.returnFlightNumber}
                      onChange={(e) => setBookingDetails({ ...bookingDetails, returnFlightNumber: e.target.value })}
                    />
                    <input
                      type="time"
                      className="border p-2 rounded text-sm"
                      value={bookingDetails.returnFlightTime}
                      onChange={(e) => setBookingDetails({ ...bookingDetails, returnFlightTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={confirmBooking}
                className="w-full mt-2 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                Confirmar e ir para o carrinho <Check size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
