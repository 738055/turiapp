"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import type { Product, ProductModule, ProductType, SaleMode, ProductRate } from "@/types";
import { CheckCircle2, ImagePlus, Languages, Plus, Save, Sparkles, Trash2, XCircle, type LucideIcon } from "lucide-react";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { ProBadge } from "@/components/admin/PlanGate";

const MODULES: { id: ProductModule; label: string; types: { id: ProductType; label: string }[] }[] = [
  {
    id: "hospedagem",
    label: "🏡 Hospedagem",
    types: [
      { id: "pousada", label: "Pousada" },
      { id: "hotel", label: "Hotel" },
      { id: "airbnb", label: "Aluguel por temporada" },
      { id: "chalé", label: "Chalé" },
      { id: "resort", label: "Resort" },
    ],
  },
  {
    id: "receptivo",
    label: "🗺️ Receptivo",
    types: [
      { id: "experiencia", label: "Experiência / Passeio" },
      { id: "ingresso", label: "Ingresso" },
      { id: "transporte", label: "Transporte" },
      { id: "city-tour", label: "City Tour" },
    ],
  },
  {
    id: "emissivo",
    label: "✈️ Emissivo",
    types: [
      { id: "pacote", label: "Pacote" },
      { id: "cruzeiro", label: "Cruzeiro" },
      { id: "viagem", label: "Viagem" },
    ],
  },
];

interface RateForm {
  id: string;
  name: string;
  price: string;
  rate_type: string;
  valid_from: string;
  valid_to: string;
  season_name: string;
  occupancy_min: string;
  occupancy_max: string;
}

interface ItineraryStepForm {
  title: string;
  description: string;
  time: string;
}

interface ProductExtraForm {
  duration: string;
  location: string;
  highlights: string[];
  included: string[];
  not_included: string[];
  itinerary: ItineraryStepForm[];
  important_info: string;
  cancellation_policy: string;
  guide_languages: string[];
  gallery: string[];
  capacity: string;
  bedrooms: string;
  bathrooms: string;
}

interface RateTypeOption {
  value: ProductRate["rate_type"];
  label: string;
}

interface ProductContentProfile {
  intro: string;
  durationLabel: string;
  durationPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  capacityLabel?: string;
  capacityPlaceholder?: string;
  showBedrooms: boolean;
  showBathrooms: boolean;
  showGuideLanguages: boolean;
  guideLanguagesLabel: string;
  guideLanguagesPlaceholder: string;
  showItinerary: boolean;
  itineraryLabel: string;
  itineraryHelp: string;
  itineraryTimeLabel: string;
  itineraryTimePlaceholder: string;
  itineraryTitlePlaceholder: string;
  itineraryDescriptionPlaceholder: string;
  highlightsPlaceholder: string;
  includedPlaceholder: string;
  notIncludedPlaceholder: string;
  importantPlaceholder: string;
  cancellationPlaceholder: string;
  rateIntro: string;
  rateTypes: RateTypeOption[];
  rateMinLabel: string;
  rateMaxLabel: string;
  defaultMax: string;
}

interface ProductFormProps {
  tenantId: string;
  defaultWhatsapp: string;
  mode: "create" | "edit";
  initialProduct?: Product & { rates?: ProductRate[] };
  /** When false (plano Básico), the online booking mode is locked behind a Pro upsell. */
  bookingEngineAllowed?: boolean;
}

function moduleDisplayName(module: ProductModule): string {
  if (module === "hospedagem") return "Hospedagem";
  if (module === "emissivo") return "Emissivo";
  return "Receptivo";
}

function getProductContentProfile(module: ProductModule, type: ProductType): ProductContentProfile {
  const common = {
    showBedrooms: false,
    showBathrooms: false,
    showGuideLanguages: false,
    guideLanguagesLabel: "Idiomas do guia",
    guideLanguagesPlaceholder: "Portugues",
    showItinerary: true,
    itineraryLabel: "Roteiro",
    itineraryHelp: "Cadastre uma etapa por vez. A pagina do produto monta uma linha do tempo com essas informacoes.",
    itineraryTimeLabel: "Horario / periodo",
    itineraryTimePlaceholder: "08:00",
    itineraryTitlePlaceholder: "Inicio da experiencia",
    itineraryDescriptionPlaceholder: "Explique o que acontece nesta etapa.",
    highlightsPlaceholder: "Atendimento local",
    includedPlaceholder: "Item incluso",
    notIncludedPlaceholder: "Item nao incluso",
    importantPlaceholder: "Documentos, ponto de encontro, idade minima, regras de embarque...",
    cancellationPlaceholder: "Ex: Cancelamento sem custo ate 24h antes.",
    rateIntro: "Use tarifas por temporada, feriados, datas especiais ou lotes promocionais.",
    rateTypes: [
      { value: "per_person", label: "Por pessoa" },
      { value: "per_group", label: "Por grupo/reserva" },
      { value: "fixed", label: "Fixo" },
    ] satisfies RateTypeOption[],
    rateMinLabel: "Pessoas minimas",
    rateMaxLabel: "Pessoas maximas",
    defaultMax: "10",
  };

  if (module === "hospedagem") {
    return {
      ...common,
      intro: "Campos para cards, detalhes da acomodacao, pagina do produto e modelos de loja de hospedagem.",
      durationLabel: "Periodo / regra de diaria",
      durationPlaceholder: "Ex: Minimo de 2 diarias, diaria flexivel",
      locationLabel: "Regiao / endereco resumido",
      locationPlaceholder: "Ex: Centro de Gramado, frente ao mar",
      capacityLabel: "Capacidade",
      capacityPlaceholder: "Ex: Ate 4 hospedes",
      showBedrooms: true,
      showBathrooms: true,
      showItinerary: false,
      highlightsPlaceholder: "Cafe da manha incluso",
      includedPlaceholder: "Roupa de cama e banho",
      notIncludedPlaceholder: "Taxa de limpeza",
      importantPlaceholder: "Check-in, check-out, regras da casa, acessibilidade, estacionamento...",
      cancellationPlaceholder: "Ex: Cancelamento sem custo ate 7 dias antes do check-in.",
      rateTypes: [
        { value: "per_night", label: "Por noite" },
        { value: "fixed", label: "Fixo por reserva" },
        { value: "per_person", label: "Por hospede" },
      ],
      rateMinLabel: "Hospedes minimos",
      rateMaxLabel: "Hospedes maximos",
      defaultMax: "2",
    };
  }

  if (module === "receptivo" && type === "ingresso") {
    return {
      ...common,
      intro: "Campos para ingresso, voucher, regras de uso, atrativo e detalhes que aparecem na loja.",
      durationLabel: "Validade / horario de uso",
      durationPlaceholder: "Ex: Valido para o dia escolhido, das 9h as 18h",
      locationLabel: "Atrativo / local de uso",
      locationPlaceholder: "Ex: Parque Nacional, Museu, Show",
      capacityLabel: "Limite por compra",
      capacityPlaceholder: "Ex: Ate 10 ingressos por compra",
      showItinerary: false,
      highlightsPlaceholder: "Voucher digital",
      includedPlaceholder: "Entrada no atrativo",
      notIncludedPlaceholder: "Transporte ate o local",
      importantPlaceholder: "Como usar o voucher, documento necessario, regras de meia entrada, validade...",
      cancellationPlaceholder: "Ex: Ingresso reembolsavel ate 24h antes da data marcada.",
      rateTypes: [
        { value: "per_person", label: "Por ingresso/pessoa" },
        { value: "fixed", label: "Fixo por compra" },
      ],
      rateMinLabel: "Ingressos minimos",
      rateMaxLabel: "Ingressos maximos",
      defaultMax: "10",
    };
  }

  if (module === "receptivo" && type === "transporte") {
    return {
      ...common,
      intro: "Campos para transfer, traslado, transporte privativo ou compartilhado.",
      durationLabel: "Duracao estimada / janela",
      durationPlaceholder: "Ex: 45 minutos, saidas entre 8h e 10h",
      locationLabel: "Rota / origem e destino",
      locationPlaceholder: "Ex: Aeroporto > Hotel, Foz > Cataratas",
      capacityLabel: "Capacidade do veiculo",
      capacityPlaceholder: "Ex: Ate 4 passageiros, van ate 15 pessoas",
      showItinerary: true,
      itineraryLabel: "Trajeto",
      itineraryHelp: "Cadastre trechos, paradas ou pontos de embarque na ordem em que acontecem.",
      itineraryTimeLabel: "Horario / janela",
      itineraryTimePlaceholder: "08:00-09:00",
      itineraryTitlePlaceholder: "Embarque no hotel",
      itineraryDescriptionPlaceholder: "Detalhe o ponto de encontro, parada ou trecho.",
      highlightsPlaceholder: "Motorista privativo",
      includedPlaceholder: "Veiculo com ar-condicionado",
      notIncludedPlaceholder: "Paradas extras",
      importantPlaceholder: "Bagagem permitida, tolerancia de atraso, ponto de encontro, regras de embarque...",
      rateTypes: [
        { value: "per_group", label: "Por veiculo/grupo" },
        { value: "per_person", label: "Por passageiro" },
        { value: "fixed", label: "Fixo" },
      ],
      rateMinLabel: "Passageiros minimos",
      rateMaxLabel: "Passageiros maximos",
      defaultMax: "4",
    };
  }

  if (module === "emissivo") {
    return {
      ...common,
      intro: "Campos para pacotes, viagens, cruzeiros e roteiros vendidos por agencia.",
      durationLabel: "Duracao da viagem",
      durationPlaceholder: "Ex: 5 dias / 4 noites, 8 dias / 7 noites",
      locationLabel: "Destino",
      locationPlaceholder: "Ex: Gramado e Canela, Caribe, Europa",
      capacityLabel: "Grupo / vagas",
      capacityPlaceholder: "Ex: Grupo minimo 10 pessoas, saida para ate 30 passageiros",
      showGuideLanguages: true,
      guideLanguagesLabel: "Idiomas / suporte",
      guideLanguagesPlaceholder: "Portugues, espanhol, suporte da agencia",
      highlightsPlaceholder: "Hoteis selecionados",
      includedPlaceholder: "Hospedagem conforme roteiro",
      notIncludedPlaceholder: "Passagens nao descritas",
      importantPlaceholder: "Documentacao, visto, seguro, bagagem, regras de parcelamento, taxas locais...",
      cancellationPlaceholder: "Ex: Condicoes conforme contrato, fornecedor e data de embarque.",
      rateTypes: [
        { value: "per_person", label: "Por viajante" },
        { value: "per_group", label: "Por pacote/grupo" },
        { value: "fixed", label: "Fixo" },
      ],
      rateMinLabel: "Viajantes minimos",
      rateMaxLabel: "Viajantes maximos",
      defaultMax: "2",
    };
  }

  return {
    ...common,
    intro: "Campos para passeio, experiencia, city tour ou atividade receptiva.",
    durationLabel: "Duracao do passeio",
    durationPlaceholder: "Ex: 6 horas, meio periodo, dia inteiro",
    locationLabel: "Destino / ponto de encontro",
    locationPlaceholder: "Ex: Foz do Iguacu, hotel do cliente, centro historico",
    capacityLabel: "Vagas / capacidade",
    capacityPlaceholder: "Ex: Ate 15 pessoas por saida",
    showGuideLanguages: true,
    highlightsPlaceholder: "Guia local credenciado",
    includedPlaceholder: "Transporte durante o passeio",
    notIncludedPlaceholder: "Alimentacao",
    importantPlaceholder: "Ponto de encontro, documentos, roupa recomendada, acessibilidade, restricoes...",
    cancellationPlaceholder: "Ex: Cancelamento sem custo ate 24h antes do passeio.",
    rateTypes: [
      { value: "per_person", label: "Por pessoa" },
      { value: "per_group", label: "Por grupo/reserva" },
      { value: "fixed", label: "Fixo" },
    ],
    rateMinLabel: "Pessoas minimas",
    rateMaxLabel: "Pessoas maximas",
    defaultMax: "10",
  };
}

export function ProductForm({ tenantId, defaultWhatsapp, mode, initialProduct, bookingEngineAllowed = true }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // A product already in booking mode (e.g. created during the trial) keeps it
  // even after a downgrade — only NEW booking activations are locked.
  const bookingUsable = bookingEngineAllowed || initialProduct?.sale_mode === "booking";

  const [form, setForm] = useState({
    module: (initialProduct?.module ?? "receptivo") as ProductModule,
    type: (initialProduct?.type ?? "experiencia") as ProductType,
    title: initialProduct?.title ?? "",
    slug: initialProduct?.slug ?? "",
    description: initialProduct?.description ?? "",
    status: initialProduct?.status ?? "draft",
    sale_mode: (initialProduct?.sale_mode ?? "whatsapp") as SaleMode,
    whatsapp_number: initialProduct?.whatsapp_number ?? defaultWhatsapp,
    seo_title: initialProduct?.seo_title ?? "",
    seo_description: initialProduct?.seo_description ?? "",
  });
  const [extra, setExtra] = useState<ProductExtraForm>(() => {
    const data = (initialProduct?.extra_data ?? {}) as Record<string, unknown>;
    return {
      duration: stringValue(data.duration),
      location: stringValue(data.location),
      highlights: arrayFromValue(data.highlights),
      included: arrayFromValue(data.included),
      not_included: arrayFromValue(data.not_included),
      itinerary: itineraryFromValue(data.itinerary),
      important_info: stringValue(data.important_info),
      cancellation_policy: stringValue(data.cancellation_policy),
      guide_languages: arrayFromValue(data.guide_languages),
      gallery: arrayFromValue(data.gallery),
      capacity: stringValue(data.capacity),
      bedrooms: stringValue(data.bedrooms),
      bathrooms: stringValue(data.bathrooms),
    };
  });

  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);

  const [rates, setRates] = useState<RateForm[]>(
    initialProduct?.rates?.map((r) => ({
      id: r.id,
      name: r.name,
      price: String(r.price),
      rate_type: r.rate_type,
      valid_from: r.valid_from ?? "",
      valid_to: r.valid_to ?? "",
      season_name: r.season_name ?? "",
      occupancy_min: String(r.occupancy_min),
      occupancy_max: String(r.occupancy_max),
    })) ?? []
  );

  const currentModule = MODULES.find((m) => m.id === form.module);
  const currentType = currentModule?.types.find((t) => t.id === form.type);
  const productProfile = getProductContentProfile(form.module, form.type);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function changeProductKind(module: ProductModule, type: ProductType) {
    const nextProfile = getProductContentProfile(module, type);
    const allowedRateTypes = new Set(nextProfile.rateTypes.map((option) => option.value));
    const fallbackRateType = nextProfile.rateTypes[0]?.value ?? "fixed";

    setForm((f) => ({ ...f, module, type }));
    setRates((current) =>
      current.map((rate) =>
        allowedRateTypes.has(rate.rate_type as ProductRate["rate_type"])
          ? rate
          : { ...rate, rate_type: fallbackRateType }
      )
    );
  }

  function updateExtra<K extends keyof ProductExtraForm>(field: K, value: ProductExtraForm[K]) {
    setExtra((current) => ({ ...current, [field]: value }));
  }

  function updateTitle(title: string) {
    setForm((f) => ({ ...f, title, slug: mode === "create" ? slugify(title) : f.slug }));
  }

  function addRate() {
    setRates((r) => [
      ...r,
      {
        id: crypto.randomUUID(),
        name: "Tarifa padrão",
        price: "",
        rate_type: productProfile.rateTypes[0]?.value ?? "fixed",
        valid_from: "",
        valid_to: "",
        season_name: "",
        occupancy_min: "1",
        occupancy_max: productProfile.defaultMax,
      },
    ]);
  }

  function updateRate(id: string, field: keyof RateForm, value: string) {
    setRates((r) => r.map((rate) => (rate.id === id ? { ...rate, [field]: value } : rate)));
  }

  function removeRate(id: string) {
    setRates((r) => r.filter((rate) => rate.id !== id));
  }

  async function handleSave() {
    setError(null);
    if (form.sale_mode === "booking") {
      if (!rates.length) {
        setError("Adicione pelo menos uma tarifa para publicar com reserva online.");
        return;
      }
      if (rates.some((rate) => (parseFloat(rate.price) || 0) <= 0)) {
        setError("Toda tarifa de reserva online precisa ter preco maior que zero.");
        return;
      }
    }
    startTransition(async () => {
      const res = await fetch("/api/products/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          product_id: initialProduct?.id,
          mode,
          ...form,
          images,
          extra_data: extraToPayload(extra),
          rates: rates.map((r) => ({
            ...r,
            price: parseFloat(r.price) || 0,
            occupancy_min: parseInt(r.occupancy_min) || 1,
            occupancy_max: parseInt(r.occupancy_max) || 99,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao salvar produto.");
        return;
      }

      router.push("/produtos");
    });
  }

  return (
    <div className="space-y-5">
      {/* Module & type */}
      <Card>
        <CardHeader><CardTitle className="text-base">Módulo e tipo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => changeProductKind(m.id, m.types[0].id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                  form.module === m.id
                    ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {currentModule?.types.map((t) => (
              <button
                key={t.id}
                onClick={() => changeProductKind(form.module, t.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  form.type === t.id
                    ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle className="text-base">Fotos do produto</CardTitle></CardHeader>
        <CardContent>
          <MultiImageUpload
            tenantId={tenantId}
            folder="products"
            values={images}
            onChange={setImages}
            maxImages={8}
            label=""
          />
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações básicas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do produto</Label>
            <Input value={form.title} onChange={(e) => updateTitle(e.target.value)}
              placeholder="Ex: Passeio de Barco Pôr do Sol" />
          </div>
          <div className="space-y-1.5">
            <Label>URL amigável (slug)</Label>
            <div className="flex items-center rounded-[var(--radius)] border overflow-hidden">
              <span className="bg-gray-50 border-r px-3 py-2 text-sm text-gray-400">/produto/</span>
              <Input
                value={form.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                className="border-0 rounded-none focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm resize-none h-24"
              placeholder="Descreva o produto para seus clientes..."
            />
          </div>
          <div className="flex gap-2">
            {["draft", "published", "archived"].map((s) => (
              <button
                key={s}
                onClick={() => update("status", s)}
                className={`rounded border px-3 py-1.5 text-xs transition-all ${
                  form.status === s ? "border-sky-500 bg-sky-50 text-sky-700 font-medium" : "border-gray-200 text-gray-500"
                }`}
              >
                {s === "draft" ? "Rascunho" : s === "published" ? "Publicado" : "Arquivado"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteudo usado no layout</CardTitle>
          <p className="text-xs text-gray-400">
            {moduleDisplayName(form.module)} / {currentType?.label}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            {productProfile.intro}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{productProfile.durationLabel}</Label>
              <Input value={extra.duration} onChange={(e) => updateExtra("duration", e.target.value)} placeholder={productProfile.durationPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label>{productProfile.locationLabel}</Label>
              <Input value={extra.location} onChange={(e) => updateExtra("location", e.target.value)} placeholder={productProfile.locationPlaceholder} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {productProfile.capacityLabel && (
              <div className="space-y-1.5">
                <Label>{productProfile.capacityLabel}</Label>
                <Input value={extra.capacity} onChange={(e) => updateExtra("capacity", e.target.value)} placeholder={productProfile.capacityPlaceholder} />
              </div>
            )}
            {productProfile.showBedrooms && (
              <div className="space-y-1.5">
                <Label>Quartos</Label>
                <Input value={extra.bedrooms} onChange={(e) => updateExtra("bedrooms", e.target.value)} placeholder="Ex: 2 quartos" />
              </div>
            )}
            {productProfile.showBathrooms && (
              <div className="space-y-1.5">
                <Label>Banheiros</Label>
                <Input value={extra.bathrooms} onChange={(e) => updateExtra("bathrooms", e.target.value)} placeholder="Ex: 1 banheiro" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ListField
              label="Destaques"
              value={extra.highlights}
              onChange={(value) => updateExtra("highlights", value)}
              placeholder={productProfile.highlightsPlaceholder}
              addLabel="Adicionar destaque"
              tone="highlight"
            />
            <ListField
              label="Inclui"
              value={extra.included}
              onChange={(value) => updateExtra("included", value)}
              placeholder={productProfile.includedPlaceholder}
              addLabel="Adicionar item incluso"
              tone="include"
            />
            <ListField
              label="Nao inclui"
              value={extra.not_included}
              onChange={(value) => updateExtra("not_included", value)}
              placeholder={productProfile.notIncludedPlaceholder}
              addLabel="Adicionar item nao incluso"
              tone="exclude"
            />
            <div className="space-y-1.5">
              <Label>Informacoes importantes</Label>
              <textarea
                value={extra.important_info}
                onChange={(e) => updateExtra("important_info", e.target.value)}
                className="h-24 w-full resize-none rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
                placeholder={productProfile.importantPlaceholder}
              />
            </div>
            {productProfile.showGuideLanguages && (
              <ListField
                label={productProfile.guideLanguagesLabel}
                value={extra.guide_languages}
                onChange={(value) => updateExtra("guide_languages", value)}
                placeholder={productProfile.guideLanguagesPlaceholder}
                addLabel="Adicionar idioma"
                tone="language"
              />
            )}
            <ListField
              label="Galeria adicional por URL"
              value={extra.gallery}
              onChange={(value) => updateExtra("gallery", value)}
              placeholder="https://..."
              addLabel="Adicionar foto por URL"
              tone="gallery"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Politica de cancelamento</Label>
            <textarea
              value={extra.cancellation_policy}
              onChange={(e) => updateExtra("cancellation_policy", e.target.value)}
              className="h-20 w-full resize-none rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
              placeholder={productProfile.cancellationPlaceholder}
            />
          </div>
          {productProfile.showItinerary && (
            <ItineraryField
              value={extra.itinerary}
              onChange={(value) => updateExtra("itinerary", value)}
              label={productProfile.itineraryLabel}
              help={productProfile.itineraryHelp}
              timeLabel={productProfile.itineraryTimeLabel}
              timePlaceholder={productProfile.itineraryTimePlaceholder}
              titlePlaceholder={productProfile.itineraryTitlePlaceholder}
              descriptionPlaceholder={productProfile.itineraryDescriptionPlaceholder}
            />
          )}
        </CardContent>
      </Card>

      {/* Sale mode */}
      <Card>
        <CardHeader><CardTitle className="text-base">Como o cliente compra?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => update("sale_mode", "whatsapp")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                form.sale_mode === "whatsapp" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-sm">💬 WhatsApp</p>
              <p className="text-xs text-gray-400 mt-1">
                Botão abre WhatsApp com o nome do produto já preenchido
              </p>
            </button>
            <button
              onClick={() => bookingUsable && update("sale_mode", "booking")}
              disabled={!bookingUsable}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                !bookingUsable
                  ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                  : form.sale_mode === "booking"
                  ? "border-sky-500 bg-sky-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-sm flex items-center gap-1.5">
                💳 Reserva online {!bookingUsable && <ProBadge />}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {bookingUsable
                  ? "Motor de reservas com escolha de data e pagamento online"
                  : "Disponível no plano Pro — venda online com pagamento e calendário"}
              </p>
            </button>
          </div>

          {form.sale_mode === "whatsapp" && (
            <div className="space-y-1.5">
              <Label>Número WhatsApp (com código do país)</Label>
              <Input
                value={form.whatsapp_number}
                onChange={(e) => update("whatsapp_number", e.target.value)}
                placeholder="+5511999999999"
              />
              <p className="text-xs text-gray-400">
                O cliente receberá uma mensagem com: &quot;Olá! Tenho interesse no produto: {form.title || "[Nome do produto]"}&quot;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates / Tarifario */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Tarifario e temporadas</CardTitle>
            <p className="mt-1 text-xs text-gray-400">
              {form.sale_mode === "booking"
                ? "Usado no motor de reservas, carrinho e checkout."
                : "Opcional: aparece na loja como referencia comercial, mas a venda continua por consulta."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar tarifa
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">{productProfile.rateIntro}</p>
            {!rates.length && (
              <p className="text-sm text-gray-400 text-center py-4">
                {form.sale_mode === "booking"
                  ? "Adicione pelo menos uma tarifa para ativar o motor de reservas."
                  : "Adicione tarifas se quiser mostrar valores no detalhe do produto."}
              </p>
            )}
            {rates.map((rate) => (
              <div key={rate.id} className="rounded-lg border p-4 space-y-3 relative">
                <button
                  onClick={() => removeRate(rate.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome da tarifa</Label>
                    <Input value={rate.name} onChange={(e) => updateRate(rate.id, "name", e.target.value)}
                      className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço (BRL)</Label>
                    <Input type="number" value={rate.price}
                      onChange={(e) => updateRate(rate.id, "price", e.target.value)}
                      className="h-8 text-xs" placeholder="199.90" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <select value={rate.rate_type}
                      onChange={(e) => updateRate(rate.id, "rate_type", e.target.value)}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs h-8">
                      {productProfile.rateTypes.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nome da temporada (opcional)</Label>
                    <Input value={rate.season_name}
                      onChange={(e) => updateRate(rate.id, "season_name", e.target.value)}
                      className="h-8 text-xs" placeholder="Alta temporada" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Válida de</Label>
                    <Input type="date" value={rate.valid_from}
                      onChange={(e) => updateRate(rate.id, "valid_from", e.target.value)}
                      className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Válida até</Label>
                    <Input type="date" value={rate.valid_to}
                      onChange={(e) => updateRate(rate.id, "valid_to", e.target.value)}
                      className="h-8 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{productProfile.rateMinLabel}</Label>
                    <Input type="number" value={rate.occupancy_min}
                      onChange={(e) => updateRate(rate.id, "occupancy_min", e.target.value)}
                      className="h-8 text-xs" min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{productProfile.rateMaxLabel}</Label>
                    <Input type="number" value={rate.occupancy_max}
                      onChange={(e) => updateRate(rate.id, "occupancy_max", e.target.value)}
                      className="h-8 text-xs" min={1} />
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle className="text-base">SEO do produto</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título SEO</Label>
            <Input value={form.seo_title}
              onChange={(e) => update("seo_title", e.target.value)}
              placeholder={form.title || "Igual ao nome se vazio"} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição SEO</Label>
            <textarea value={form.seo_description}
              onChange={(e) => update("seo_description", e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-xs resize-none h-16"
              placeholder="Até 160 caracteres" maxLength={160} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/produtos")}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : mode === "create" ? "Criar produto" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

type ListFieldTone = "neutral" | "highlight" | "include" | "exclude" | "language" | "gallery";

const LIST_FIELD_TONES: Record<
  ListFieldTone,
  {
    icon: LucideIcon;
    wrapper: string;
    iconBox: string;
    input: string;
    addButton: string;
  }
> = {
  neutral: {
    icon: Plus,
    wrapper: "border-gray-200 bg-white",
    iconBox: "bg-gray-100 text-gray-600",
    input: "border-gray-200 bg-white",
    addButton: "border-gray-300 text-gray-600 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700",
  },
  highlight: {
    icon: Sparkles,
    wrapper: "border-amber-200 bg-amber-50/70",
    iconBox: "bg-amber-100 text-amber-700",
    input: "border-amber-200 bg-white focus-visible:ring-amber-500",
    addButton: "border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-100",
  },
  include: {
    icon: CheckCircle2,
    wrapper: "border-emerald-200 bg-emerald-50/70",
    iconBox: "bg-emerald-100 text-emerald-700",
    input: "border-emerald-200 bg-white focus-visible:ring-emerald-500",
    addButton: "border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100",
  },
  exclude: {
    icon: XCircle,
    wrapper: "border-rose-200 bg-rose-50/70",
    iconBox: "bg-rose-100 text-rose-700",
    input: "border-rose-200 bg-white focus-visible:ring-rose-500",
    addButton: "border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-100",
  },
  language: {
    icon: Languages,
    wrapper: "border-sky-200 bg-sky-50/70",
    iconBox: "bg-sky-100 text-sky-700",
    input: "border-sky-200 bg-white focus-visible:ring-sky-500",
    addButton: "border-sky-300 text-sky-700 hover:border-sky-400 hover:bg-sky-100",
  },
  gallery: {
    icon: ImagePlus,
    wrapper: "border-violet-200 bg-violet-50/70",
    iconBox: "bg-violet-100 text-violet-700",
    input: "border-violet-200 bg-white focus-visible:ring-violet-500",
    addButton: "border-violet-300 text-violet-700 hover:border-violet-400 hover:bg-violet-100",
  },
};

function ListField({
  label,
  value,
  onChange,
  placeholder,
  addLabel,
  tone = "neutral",
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  addLabel: string;
  tone?: ListFieldTone;
}) {
  const items = value.length ? value : [""];
  const styles = LIST_FIELD_TONES[tone];
  const Icon = styles.icon;

  function updateItem(index: number, itemValue: string) {
    const next = [...items];
    next[index] = itemValue;
    onChange(next);
  }

  function removeItem(index: number) {
    const next = items.filter((_, currentIndex) => currentIndex !== index);
    onChange(next.length ? next : []);
  }

  return (
    <div className={`space-y-2 rounded-xl border p-3 ${styles.wrapper}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${styles.iconBox}`}>
          <Icon className="h-4 w-4" />
        </span>
        <Label className="text-sm font-semibold">{label}</Label>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
              className={`h-9 text-sm ${styles.input}`}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              aria-label={`Remover ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className={`inline-flex items-center gap-1.5 rounded border border-dashed px-3 py-1.5 text-xs font-medium transition ${styles.addButton}`}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function ItineraryField({
  value,
  onChange,
  label,
  help,
  timeLabel,
  timePlaceholder,
  titlePlaceholder,
  descriptionPlaceholder,
}: {
  value: ItineraryStepForm[];
  onChange: (value: ItineraryStepForm[]) => void;
  label: string;
  help: string;
  timeLabel: string;
  timePlaceholder: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
}) {
  const steps = value.length ? value : [{ title: "", description: "", time: "" }];

  function updateStep(index: number, field: keyof ItineraryStepForm, fieldValue: string) {
    const next = [...steps];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(next);
  }

  function removeStep(index: number) {
    const next = steps.filter((_, currentIndex) => currentIndex !== index);
    onChange(next.length ? next : []);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs text-gray-400">{help}</p>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="relative rounded-lg border border-gray-200 bg-white p-3">
            <button
              type="button"
              onClick={() => removeStep(index)}
              className="absolute right-2 top-2 text-gray-400 transition hover:text-red-500"
              aria-label="Remover etapa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <p className="mb-3 text-xs font-semibold uppercase text-gray-400">Etapa {index + 1}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
              <div className="space-y-1">
                <Label className="text-xs">{timeLabel}</Label>
                <Input value={step.time} onChange={(e) => updateStep(index, "time", e.target.value)} placeholder={timePlaceholder} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Titulo da etapa</Label>
                <Input value={step.title} onChange={(e) => updateStep(index, "title", e.target.value)} placeholder={titlePlaceholder} className="h-8 text-xs" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Label className="text-xs">Descricao</Label>
              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, "description", e.target.value)}
                className="h-20 w-full resize-none rounded border border-gray-200 px-3 py-2 text-xs"
                placeholder={descriptionPlaceholder}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...steps, { title: "", description: "", time: "" }])}
        className="inline-flex items-center gap-1.5 rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar etapa
      </button>
    </div>
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function arrayFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function cleanArray(value: string[]): string[] {
  return value.map((item) => item.trim()).filter(Boolean);
}

function itineraryFromValue(value: unknown): ItineraryStepForm[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const row = item as { title?: unknown; description?: unknown; time?: unknown };
      const title = typeof row.title === "string" ? row.title : "";
      const description = typeof row.description === "string" ? row.description : "";
      const time = typeof row.time === "string" ? row.time : "";
      return title || description || time ? { title, description, time } : null;
    })
    .filter((item): item is ItineraryStepForm => !!item);
}

function cleanItinerary(value: ItineraryStepForm[]): ItineraryStepForm[] {
  return value
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      time: item.time.trim(),
    }))
    .filter((item) => item.title || item.description || item.time);
}

function extraToPayload(extra: ProductExtraForm): Record<string, unknown> {
  return {
    duration: extra.duration.trim(),
    location: extra.location.trim(),
    highlights: cleanArray(extra.highlights),
    included: cleanArray(extra.included),
    not_included: cleanArray(extra.not_included),
    itinerary: cleanItinerary(extra.itinerary),
    important_info: extra.important_info.trim(),
    cancellation_policy: extra.cancellation_policy.trim(),
    guide_languages: cleanArray(extra.guide_languages),
    gallery: cleanArray(extra.gallery),
    capacity: extra.capacity.trim(),
    bedrooms: extra.bedrooms.trim(),
    bathrooms: extra.bathrooms.trim(),
  };
}
