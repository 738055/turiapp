"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils";
import type { Product, ProductModule, ProductType, SaleMode, ProductRate } from "@/types";
import { Plus, Trash2, Save } from "lucide-react";
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

interface ProductFormProps {
  tenantId: string;
  defaultWhatsapp: string;
  mode: "create" | "edit";
  initialProduct?: Product & { rates?: ProductRate[] };
  /** When false (plano Básico), the online booking mode is locked behind a Pro upsell. */
  bookingEngineAllowed?: boolean;
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

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
        rate_type: "fixed",
        valid_from: "",
        valid_to: "",
        season_name: "",
        occupancy_min: "1",
        occupancy_max: "10",
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
                onClick={() => {
                  update("module", m.id);
                  update("type", m.types[0].id);
                }}
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
                onClick={() => update("type", t.id)}
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

      {/* Rates / Tarifário (only for booking mode) */}
      {form.sale_mode === "booking" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tarifário e temporadas</CardTitle>
            <Button variant="outline" size="sm" onClick={addRate}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar tarifa
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!rates.length && (
              <p className="text-sm text-gray-400 text-center py-4">
                Adicione pelo menos uma tarifa para ativar o motor de reservas.
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
                      <option value="fixed">Fixo (por grupo/reserva)</option>
                      <option value="per_person">Por pessoa</option>
                      <option value="per_night">Por noite</option>
                      <option value="per_group">Por grupo</option>
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
                    <Label className="text-xs">Ocupação mínima</Label>
                    <Input type="number" value={rate.occupancy_min}
                      onChange={(e) => updateRate(rate.id, "occupancy_min", e.target.value)}
                      className="h-8 text-xs" min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ocupação máxima</Label>
                    <Input type="number" value={rate.occupancy_max}
                      onChange={(e) => updateRate(rate.id, "occupancy_max", e.target.value)}
                      className="h-8 text-xs" min={1} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
