"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addItem } from "@/lib/cart/store";
import { formatCurrency } from "@/lib/utils";
import { MessageCircle, ShoppingCart, Check } from "lucide-react";
import type { Product, ProductRate, Theme } from "@/types";

interface BookingWidgetProps {
  product: Product & { rates?: ProductRate[] };
  theme: Theme | null;
  tenantId: string;
  embedded?: boolean;
  hasOnlinePayment?: boolean;
}

interface BookingForm {
  checkin: string;
  checkout: string;
  guests: number;
  rateId: string;
  name: string;
  email: string;
  phone: string;
}

export function BookingWidget({ product, theme, tenantId, embedded = false, hasOnlinePayment = false }: BookingWidgetProps) {
  const primaryColor = theme?.primary_color ?? "#0ea5e9";

  if (product.sale_mode === "whatsapp") {
    return <WhatsAppOrderWidget product={product} primaryColor={primaryColor} tenantId={tenantId} />;
  }

  if (product.id === "__legacy_whatsapp_disabled__") {
    const phone = product.whatsapp_number?.replace(/\D/g, "") ?? "";
    const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${product.title}`);
    if (!phone) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-semibold text-amber-800">Produto sob consulta</p>
          <p className="mt-1 text-xs text-amber-700">Use o formulario abaixo para solicitar atendimento da equipe.</p>
        </div>
      );
    }
    const href = `https://wa.me/${phone}?text=${msg}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-[var(--radius,0.5rem)] py-3 text-white font-semibold text-base transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Falar no WhatsApp
      </a>
    );
  }

  return <BookingForm product={product} primaryColor={primaryColor} tenantId={tenantId} embedded={embedded} hasOnlinePayment={hasOnlinePayment} />;
}

function RateOptions({
  rates,
  selectedRateId,
  primaryColor,
  onSelect,
}: {
  rates: ProductRate[];
  selectedRateId: string;
  primaryColor: string;
  onSelect: (rateId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Tarifa</Label>
        <span className="text-[11px] font-medium text-gray-400">
          {rates.length} {rates.length === 1 ? "opcao" : "opcoes"}
        </span>
      </div>
      <div className="space-y-2">
        {rates.map((rate) => {
          const selected = rate.id === selectedRateId;

          return (
            <button
              key={rate.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(rate.id)}
              className={`w-full rounded-[var(--radius,0.75rem)] border p-3 text-left transition-all ${
                selected ? "shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={
                selected
                  ? {
                      borderColor: primaryColor,
                      backgroundColor: alphaColor(primaryColor, 0.08),
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: selected ? primaryColor : "#d1d5db",
                        backgroundColor: selected ? primaryColor : "#ffffff",
                        color: selected ? "#ffffff" : "transparent",
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <p className="truncate text-sm font-bold text-gray-900">{rate.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {rate.season_name || rateTypeLabel(rate.rate_type)}
                    {rate.occupancy_min && rate.occupancy_max
                      ? ` - ${rate.occupancy_min} a ${rate.occupancy_max} pessoas`
                      : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">{ratePeriodLabel(rate)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold leading-none" style={{ color: primaryColor }}>
                    {formatCurrency(rate.price, rate.currency)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">{rateSuffixLabel(rate.rate_type)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WhatsAppOrderWidget({
  product,
  primaryColor,
  tenantId,
}: {
  product: Product & { rates?: ProductRate[] };
  primaryColor: string;
  tenantId: string;
}) {
  const phone = product.whatsapp_number?.replace(/\D/g, "") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    checkin: "",
    checkout: "",
    guests: 1,
    rateId: "",
    name: "",
    email: "",
    phone: "",
  });
  const availableRates = ratesForDate(product.rates, form.checkin);
  const selectedRate = availableRates.find((rate) => rate.id === form.rateId);
  const usesCheckoutDate = product.module === "hospedagem" || selectedRate?.rate_type === "per_night";
  const dateLabel = product.module === "hospedagem"
    ? "Check-in"
    : product.type === "ingresso"
      ? "Data de uso"
      : product.type === "transporte"
        ? "Data do servico"
        : "Data";
  const guestsLabel = product.type === "ingresso"
    ? "Ingressos"
    : product.type === "transporte"
      ? "Passageiros"
      : product.module === "emissivo"
        ? "Viajantes"
        : product.module === "hospedagem"
          ? "Hospedes"
          : "Pessoas";
  const total = selectedRate ? calculateTotal(selectedRate, form.guests, form.checkin, form.checkout) : 0;
  const selectionReady = !!selectedRate && !!form.checkin && (!usesCheckoutDate || !!form.checkout);
  const contactReady =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.phone.trim().length >= 8;
  const ready = selectionReady && contactReady;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "checkin") {
        next.rateId = chooseRateForDate(product.rates, String(value), current.rateId);
        if (next.checkout && dateKey(next.checkout) <= dateKey(String(value))) next.checkout = "";
      }
      return next;
    });
  }

  if (!phone) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm font-semibold text-amber-800">Produto sob consulta</p>
        <p className="mt-1 text-xs text-amber-700">Use o formulario abaixo para solicitar atendimento da equipe.</p>
      </div>
    );
  }

  const lines = [
    "Ola! Tenho interesse neste produto:",
    "",
    `Produto: ${product.title}`,
    `Cliente: ${form.name.trim()}`,
    `E-mail: ${form.email.trim()}`,
    `Telefone/WhatsApp: ${form.phone.trim()}`,
    form.checkin ? `${dateLabel}: ${formatInputDate(form.checkin)}` : null,
    usesCheckoutDate && form.checkout ? `Check-out: ${formatInputDate(form.checkout)}` : null,
    selectedRate ? `Tarifa: ${selectedRate.name} - ${formatCurrency(selectedRate.price, selectedRate.currency)} ${rateSuffixLabel(selectedRate.rate_type)}` : null,
    `${guestsLabel}: ${form.guests}`,
    selectedRate ? `Total estimado: ${formatCurrency(total, selectedRate.currency)}` : null,
    "",
    "Pode me confirmar disponibilidade e proximos passos?",
  ].filter(Boolean);
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;

  function handleWhatsAppSubmit() {
    if (!ready || !selectedRate) return;
    setError(null);
    startTransition(async () => {
      const message = lines.join("\n");
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          product_id: product.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Nao foi possivel salvar seus dados. Tente novamente.");
        return;
      }

      window.location.href = href;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Enviar pedido pelo WhatsApp</h3>
        <p className="mt-1 text-xs text-gray-500">Escolha os detalhes e envie uma mensagem pronta para a equipe.</p>
      </div>

      <div className={`grid gap-3 ${usesCheckoutDate ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1">
          <Label className="text-xs">{dateLabel}</Label>
          <Input
            type="date"
            value={form.checkin}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => update("checkin", event.target.value)}
            className="h-9 text-sm"
          />
        </div>
        {usesCheckoutDate && (
          <div className="space-y-1">
            <Label className="text-xs">Check-out</Label>
            <Input
              type="date"
              value={form.checkout}
              min={form.checkin || new Date().toISOString().split("T")[0]}
              onChange={(event) => update("checkout", event.target.value)}
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>

      {form.checkin ? (
        availableRates.length > 0 ? (
          <RateOptions
            rates={availableRates}
            selectedRateId={form.rateId}
            primaryColor={primaryColor}
            onSelect={(rateId) => update("rateId", rateId)}
          />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Nenhuma tarifa cadastrada para esta data.
          </div>
        )
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
          Selecione a data para ver as tarifas disponiveis.
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">{guestsLabel}</Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update("guests", Math.max(1, form.guests - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border text-gray-500 hover:border-gray-400"
          >
            -
          </button>
          <span className="w-6 text-center font-semibold">{form.guests}</span>
          <button
            type="button"
            onClick={() => update("guests", Math.min(99, form.guests + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border text-gray-500 hover:border-gray-400"
          >
            +
          </button>
        </div>
      </div>

      {selectedRate && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-sm text-gray-500">Total estimado</span>
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {formatCurrency(total, selectedRate.currency)}
          </span>
        </div>
      )}

      <div className="rounded-[var(--radius,0.75rem)] border border-gray-200 bg-white p-3">
        <p className="text-sm font-semibold text-gray-900">Dados do comprador</p>
        <p className="mt-1 text-xs text-gray-500">
          Usaremos estes dados para atendimento, confirmacoes e comunicacoes da reserva.
        </p>
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome completo</Label>
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              className="h-9 text-sm"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              className="h-9 text-sm"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telefone / WhatsApp</Label>
            <Input
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              className="h-9 text-sm"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {ready ? (
        <Button
          type="button"
          onClick={handleWhatsAppSubmit}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius,0.5rem)] py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageCircle className="h-5 w-5" />
          {isPending ? "Salvando dados..." : "Salvar dados e abrir WhatsApp"}
        </Button>
      ) : (
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius,0.5rem)] bg-gray-200 py-3 text-base font-semibold text-gray-500"
        >
          <MessageCircle className="h-5 w-5" />
          {selectionReady ? "Informe os dados do comprador" : "Selecione data e tarifa"}
        </button>
      )}
    </div>
  );
}

function rateTypeLabel(rateType: ProductRate["rate_type"]): string {
  if (rateType === "per_night") return "Por noite";
  if (rateType === "per_person") return "Por pessoa";
  if (rateType === "per_group") return "Por grupo";
  return "Valor fixo";
}

function rateSuffixLabel(rateType: ProductRate["rate_type"]): string {
  if (rateType === "per_night") return "/ noite";
  if (rateType === "per_person") return "/ pessoa";
  if (rateType === "per_group") return "/ grupo";
  return "total";
}

function ratePeriodLabel(rate: ProductRate): string {
  if (rate.valid_from && rate.valid_to) {
    return `${formatInputDate(rate.valid_from)} a ${formatInputDate(rate.valid_to)}`;
  }
  if (rate.valid_from) return `A partir de ${formatInputDate(rate.valid_from)}`;
  if (rate.valid_to) return `Ate ${formatInputDate(rate.valid_to)}`;
  return "Disponivel em qualquer data";
}

function dateKey(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function rateMatchesDate(rate: ProductRate, checkin: string): boolean {
  const selected = dateKey(checkin);
  if (!selected) return false;
  if (rate.valid_from && selected < dateKey(rate.valid_from)) return false;
  if (rate.valid_to && selected > dateKey(rate.valid_to)) return false;
  return true;
}

function ratesForDate(rates: ProductRate[] | undefined, checkin: string): ProductRate[] {
  return (rates ?? []).filter((rate) => rate.available !== false && rateMatchesDate(rate, checkin));
}

function chooseRateForDate(rates: ProductRate[] | undefined, checkin: string, currentRateId: string): string {
  const options = ratesForDate(rates, checkin);
  if (options.some((rate) => rate.id === currentRateId)) return currentRateId;
  return options[0]?.id ?? "";
}

function alphaColor(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "rgba(14, 165, 233, 0.08)";

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function calculateTotal(rate: ProductRate, guests: number, checkin: string, checkout: string): number {
  if (rate.rate_type === "per_person") return rate.price * guests;
  if (rate.rate_type === "per_night" && checkin && checkout) {
    const nights = Math.max(
      1,
      Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    );
    return rate.price * nights;
  }
  return rate.price;
}

function formatInputDate(value: string): string {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function BookingForm({
  product,
  primaryColor,
  tenantId,
  embedded,
  hasOnlinePayment,
}: {
  product: Product & { rates?: ProductRate[] };
  primaryColor: string;
  tenantId: string;
  embedded: boolean;
  hasOnlinePayment: boolean;
}) {
  const [step, setStep] = useState<"dates" | "contact" | "confirm" | "done">("dates");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const [form, setForm] = useState<BookingForm>({
    checkin: "",
    checkout: "",
    guests: 1,
    rateId: "",
    name: "",
    email: "",
    phone: "",
  });

  const availableRates = ratesForDate(product.rates, form.checkin);
  const selectedRate = availableRates.find((r) => r.id === form.rateId);
  const usesCheckoutDate = product.module === "hospedagem" || selectedRate?.rate_type === "per_night";
  const dateLabel = product.module === "hospedagem"
    ? "Check-in"
    : product.type === "ingresso"
      ? "Data de uso"
      : product.type === "transporte"
        ? "Data do servico"
        : "Data";
  const guestsLabel = product.type === "ingresso"
    ? "Ingressos"
    : product.type === "transporte"
      ? "Passageiros"
      : product.module === "emissivo"
        ? "Viajantes"
        : product.module === "hospedagem"
        ? "Hospedes"
        : "Pessoas";
  const selectionReady = !!selectedRate && !!form.checkin && (!usesCheckoutDate || !!form.checkout);

  function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "checkin") {
        next.rateId = chooseRateForDate(product.rates, String(value), current.rateId);
        if (next.checkout && dateKey(next.checkout) <= dateKey(String(value))) next.checkout = "";
      }
      return next;
    });
  }

  function calcTotal(): number {
    if (!selectedRate) return 0;
    return calculateTotal(selectedRate, form.guests, form.checkin, form.checkout);
  }

  function handleAddToCart() {
    if (!selectedRate) return;
    addItem({
      id: crypto.randomUUID(),
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images?.[0] ?? null,
      rate_id: form.rateId,
      rate_name: selectedRate.name,
      rate_type: selectedRate.rate_type,
      unit_price: calcTotal(),
      currency: selectedRate.currency ?? "BRL",
      qty: 1,
      checkin: form.checkin || null,
      checkout: form.checkout || null,
      guests: form.guests,
      total: calcTotal(),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function handleBook() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          product_id: product.id,
          rate_id: form.rateId,
          checkin: form.checkin || null,
          checkout: form.checkout || null,
          guests: form.guests,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          total_amount: calcTotal(),
          currency: selectedRate?.currency ?? "BRL",
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erro ao criar reserva.");
        return;
      }

      const data = await res.json();
      setBookingId(data.bookingId);
      setStep("done");
    });
  }

  useEffect(() => {
    if (step === "done" && bookingId && hasOnlinePayment) {
      window.location.href = `/checkout/${bookingId}`;
    }
  }, [bookingId, hasOnlinePayment, step]);

  if (step === "done" && bookingId) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="text-sm font-semibold text-gray-800">
          {hasOnlinePayment ? "Redirecionando para o pagamento..." : "Pre-reserva recebida!"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {hasOnlinePayment
            ? "Voce sera enviado para finalizar o checkout."
            : "A equipe recebeu o pedido e vai confirmar disponibilidade e pagamento."}
        </p>
        <p className="mt-3 text-xs text-gray-400">Codigo: {bookingId.slice(0, 8).toUpperCase()}</p>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "rounded-xl border p-5 space-y-4"}>
      <div>
        <h3 className="font-semibold">{hasOnlinePayment ? "Reservar e pagar online" : "Solicitar reserva"}</h3>
        <p className="mt-1 text-xs text-gray-500">
          {hasOnlinePayment
            ? "Escolha a tarifa, informe seus dados e finalize no checkout."
            : "A reserva entra no sistema e a equipe confirma o pagamento depois."}
        </p>
      </div>

      {/* Rate selector */}
      {false && (product.rates?.length ?? 0) > 0 && (
        <RateOptions
          rates={product.rates ?? []}
          selectedRateId={form.rateId}
          primaryColor={primaryColor}
          onSelect={(rateId) => update("rateId", rateId)}
        />
      )}
      {(product.rates?.length ?? 0) > 1 && (
        <div className="hidden">
          <Label className="text-sm">Tarifa</Label>
          <select
            value={form.rateId}
            onChange={(e) => update("rateId", e.target.value)}
            className="w-full rounded-[var(--radius,0.5rem)] border border-gray-200 px-3 py-2 text-sm"
          >
            {product.rates?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — R$ {r.price.toFixed(2).replace(".", ",")}
                {r.rate_type === "per_person" ? "/pax" : r.rate_type === "per_night" ? "/noite" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dates */}
      <div className={`grid gap-3 ${usesCheckoutDate ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1">
          <Label className="text-xs">{dateLabel}</Label>
          <Input
            type="date"
            value={form.checkin}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => update("checkin", e.target.value)}
            className="text-sm h-9"
          />
        </div>
        {usesCheckoutDate && (
          <div className="space-y-1">
            <Label className="text-xs">Check-out</Label>
            <Input
              type="date"
              value={form.checkout}
              min={form.checkin || new Date().toISOString().split("T")[0]}
              onChange={(e) => update("checkout", e.target.value)}
              className="text-sm h-9"
            />
          </div>
        )}
      </div>

      {form.checkin ? (
        availableRates.length > 0 ? (
          <RateOptions
            rates={availableRates}
            selectedRateId={form.rateId}
            primaryColor={primaryColor}
            onSelect={(rateId) => update("rateId", rateId)}
          />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Nenhuma tarifa cadastrada para esta data.
          </div>
        )
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
          Selecione a data para ver as tarifas disponiveis.
        </div>
      )}

      {/* Guests */}
      <div className="space-y-1">
        <Label className="text-xs">{guestsLabel}</Label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => update("guests", Math.max(1, form.guests - 1))}
            className="h-8 w-8 rounded-full border flex items-center justify-center text-gray-500 hover:border-gray-400"
          >
            −
          </button>
          <span className="font-semibold w-6 text-center">{form.guests}</span>
          <button
            onClick={() => update("guests", Math.min(99, form.guests + 1))}
            className="h-8 w-8 rounded-full border flex items-center justify-center text-gray-500 hover:border-gray-400"
          >
            +
          </button>
        </div>
      </div>

      {step === "dates" && (
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => setStep("contact")}
            style={{ backgroundColor: primaryColor }}
            disabled={!selectionReady}
          >
            {hasOnlinePayment ? "Reservar e pagar" : "Enviar pre-reserva"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddToCart}
            disabled={!selectionReady}
          >
            {added ? (
              <><Check className="h-4 w-4 mr-1" /> Adicionado ao carrinho</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-1" /> Adicionar ao carrinho</>
            )}
          </Button>
        </div>
      )}

      {step === "contact" && (
        <>
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Seus dados</p>
            <div className="space-y-1">
              <Label className="text-xs">Nome completo</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Maria Silva"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="maria@email.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+55 (11) 99999-9999"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Total */}
          {selectedRate && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-500">Total estimado</span>
              <span className="font-bold text-lg" style={{ color: primaryColor }}>
                {formatCurrency(calcTotal(), selectedRate.currency)}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("dates")} className="flex-1">
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={handleBook}
              disabled={isPending || !form.name || !form.email || !selectionReady}
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? "Reservando..." : hasOnlinePayment ? "Confirmar e ir ao pagamento" : "Confirmar pre-reserva"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
