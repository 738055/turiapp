"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import {
  Building2,
  Palette,
  Layout,
  CreditCard,
  Package,
  Globe,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// ── Step definitions ──────────────────────────────────────────
const STEPS = [
  { id: "empresa", label: "Sua empresa", icon: Building2, description: "Dados básicos da sua loja" },
  { id: "visual", label: "Visual", icon: Palette, description: "Cores e identidade da sua marca" },
  { id: "modelo", label: "Modelo", icon: Layout, description: "Escolha o visual inicial do site" },
  { id: "pagamento", label: "Pagamento", icon: CreditCard, description: "Como seus clientes vão pagar" },
  { id: "produto", label: "Primeiro produto", icon: Package, description: "Adicione o que você vende" },
  { id: "dominio", label: "Domínio", icon: Globe, description: "Endereço da sua loja (opcional)" },
];

interface OnboardingData {
  company_name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  template: string;
  sale_mode: "booking" | "whatsapp";
  whatsapp_number: string;
  product_title: string;
  product_module: string;
  product_type: string;
  custom_domain: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    company_name: "",
    slug: "",
    primary_color: "#0ea5e9",
    secondary_color: "#0369a1",
    accent_color: "#f59e0b",
    template: "turismo-basico",
    sale_mode: "whatsapp",
    whatsapp_number: "",
    product_title: "",
    product_module: "receptivo",
    product_type: "experiencia",
    custom_domain: "",
  });

  function update(field: keyof OnboardingData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  function updateSlug(name: string) {
    setData((d) => ({ ...d, company_name: name, slug: slugify(name) }));
  }

  const isLast = step === STEPS.length - 1;

  async function finishOnboarding() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tenants/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao configurar sua loja. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  function next() {
    if (isLast) {
      finishOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-sky-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <Card>
          <CardContent className="pt-8 pb-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const Icon = STEPS[step].icon;
                  return <Icon className="h-5 w-5 text-sky-500" />;
                })()}
                <h2 className="text-xl font-bold">{STEPS[step].label}</h2>
              </div>
              <p className="text-sm text-gray-500">{STEPS[step].description}</p>
            </div>

            {/* Step content */}
            <div className="space-y-5">
              {step === 0 && (
                <StepEmpresa data={data} update={update} updateSlug={updateSlug} />
              )}
              {step === 1 && <StepVisual data={data} update={update} />}
              {step === 2 && <StepModelo data={data} update={update} />}
              {step === 3 && <StepPagamento data={data} update={update} />}
              {step === 4 && <StepProduto data={data} update={update} />}
              {step === 5 && <StepDominio data={data} update={update} />}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={next}
                disabled={loading}
                style={{ backgroundColor: "#0ea5e9" }}
              >
                {loading
                  ? "Finalizando..."
                  : isLast
                  ? "Criar minha loja!"
                  : "Próximo"}
                {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Passo {step + 1} de {STEPS.length} · Você pode alterar tudo isso depois no painel
        </p>
      </div>
    </div>
  );
}

// ── Step components ───────────────────────────────────────────

function StepEmpresa({ data, update, updateSlug }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
  updateSlug: (name: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome da empresa / agência</Label>
        <Input
          value={data.company_name}
          onChange={(e) => updateSlug(e.target.value)}
          placeholder="Bolinha Tur"
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Endereço da sua loja{" "}
          <span className="text-gray-400 text-xs font-normal">(subdomínio)</span>
        </Label>
        <div className="flex items-center rounded-[var(--radius)] border overflow-hidden">
          <Input
            value={data.slug}
            onChange={(e) => update("slug", slugify(e.target.value))}
            placeholder="bolinhatur"
            className="border-0 rounded-none flex-1 focus-visible:ring-0"
          />
          <span className="bg-gray-50 border-l px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
            .turiapp.com.br
          </span>
        </div>
        {data.slug && (
          <p className="text-xs text-green-600">
            ✓ Sua loja será: <strong>{data.slug}.turiapp.com.br</strong>
          </p>
        )}
      </div>
    </div>
  );
}

function StepVisual({ data, update }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Escolha as cores da sua marca. O preview ao vivo atualiza em tempo real.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Cor principal</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={data.primary_color}
              onChange={(e) => update("primary_color", e.target.value)}
              className="h-10 w-10 rounded cursor-pointer border" />
            <Input value={data.primary_color}
              onChange={(e) => update("primary_color", e.target.value)}
              className="text-xs" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Cor secundária</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={data.secondary_color}
              onChange={(e) => update("secondary_color", e.target.value)}
              className="h-10 w-10 rounded cursor-pointer border" />
            <Input value={data.secondary_color}
              onChange={(e) => update("secondary_color", e.target.value)}
              className="text-xs" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Destaque / CTA</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={data.accent_color}
              onChange={(e) => update("accent_color", e.target.value)}
              className="h-10 w-10 rounded cursor-pointer border" />
            <Input value={data.accent_color}
              onChange={(e) => update("accent_color", e.target.value)}
              className="text-xs" />
          </div>
        </div>
      </div>
      {/* Live preview */}
      <SitePreview
        primaryColor={data.primary_color}
        accentColor={data.accent_color}
        companyName={data.company_name || "Minha Loja"}
      />
    </div>
  );
}

function SitePreview({ primaryColor, accentColor, companyName }: {
  primaryColor: string;
  accentColor: string;
  companyName: string;
}) {
  return (
    <div className="rounded-xl border overflow-hidden shadow-sm">
      <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded text-xs text-gray-400 px-2 py-0.5 truncate">
          {companyName.toLowerCase().replace(/\s+/g, "")}.turiapp.com.br
        </div>
      </div>
      {/* Mock site */}
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Navbar */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
          <span className="text-white font-bold text-sm">{companyName}</span>
          <div className="flex gap-3">
            {["Início", "Produtos", "Contato"].map((i) => (
              <span key={i} className="text-white/80 text-xs">{i}</span>
            ))}
          </div>
        </div>
        {/* Hero */}
        <div className="px-5 py-8 text-center" style={{ backgroundColor: primaryColor + "18" }}>
          <h2 className="font-bold text-base text-gray-900">Bem-vindo à {companyName}!</h2>
          <p className="text-xs mt-1 text-gray-500">Experiências únicas para você</p>
          <div className="mt-3 inline-block px-5 py-1.5 text-xs text-white font-semibold rounded-full"
            style={{ backgroundColor: accentColor }}>
            Ver produtos
          </div>
        </div>
        {/* Cards */}
        <div className="p-4 grid grid-cols-3 gap-2 bg-white">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border rounded-lg overflow-hidden">
              <div className="h-12 bg-gray-100" />
              <div className="p-2">
                <div className="h-1.5 bg-gray-200 rounded mb-1.5" />
                <div className="h-1.5 w-2/3 bg-gray-100 rounded mb-1.5" />
                <div className="text-xs font-bold" style={{ color: primaryColor }}>R$ 199</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepModelo({ data, update }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
}) {
  const templates = [
    { id: "turismo-basico", name: "Turismo Básico", desc: "Simples e direto ao ponto", emoji: "🏖️" },
    { id: "hospedagem", name: "Hospedagem", desc: "Pousadas e acomodações", emoji: "🏡" },
    { id: "agencia", name: "Agência Completa", desc: "Múltiplos produtos e categorias", emoji: "✈️" },
    { id: "receptivo", name: "Receptivo", desc: "Passeios e experiências locais", emoji: "🗺️" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Escolha o modelo inicial. Você pode editar tudo depois.</p>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => update("template", t.id)}
            className={`rounded-xl border-2 p-4 text-left transition-all hover:border-sky-300 ${
              data.template === t.id ? "border-sky-500 bg-sky-50" : "border-gray-200"
            }`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <p className="font-semibold text-sm mt-2">{t.name}</p>
            <p className="text-xs text-gray-400">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPagamento({ data, update }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Como seus clientes vão entrar em contato para comprar?
      </p>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => update("sale_mode", "whatsapp")}
          className={`rounded-xl border-2 p-4 text-left transition-all hover:border-green-300 ${
            data.sale_mode === "whatsapp" ? "border-green-500 bg-green-50" : "border-gray-200"
          }`}
        >
          <p className="font-semibold">💬 Botão de WhatsApp</p>
          <p className="text-sm text-gray-500 mt-1">
            O cliente clica, o WhatsApp abre com o produto de interesse e você fecha a venda.
            Simples e rápido.
          </p>
        </button>
        <button
          onClick={() => update("sale_mode", "booking")}
          className={`rounded-xl border-2 p-4 text-left transition-all hover:border-sky-300 ${
            data.sale_mode === "booking" ? "border-sky-500 bg-sky-50" : "border-gray-200"
          }`}
        >
          <p className="font-semibold">💳 Motor de reservas online</p>
          <p className="text-sm text-gray-500 mt-1">
            Cliente escolhe data, paga online. Você precisa conectar Stripe ou Mercado Pago
            depois em <strong>Pagamentos</strong>.
          </p>
        </button>
      </div>
      {data.sale_mode === "whatsapp" && (
        <div className="space-y-1.5">
          <Label>Número do WhatsApp</Label>
          <Input
            value={data.whatsapp_number}
            onChange={(e) => update("whatsapp_number", e.target.value)}
            placeholder="+55 11 99999-9999"
          />
          <p className="text-xs text-gray-400">Com código do país. Ex: +5511999999999</p>
        </div>
      )}
    </div>
  );
}

function StepProduto({ data, update }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
}) {
  const modules = [
    { id: "hospedagem", label: "🏡 Hospedagem", types: [
      { id: "pousada", label: "Pousada" }, { id: "hotel", label: "Hotel" }, { id: "airbnb", label: "Aluguel por temporada" },
    ]},
    { id: "receptivo", label: "🗺️ Receptivo", types: [
      { id: "experiencia", label: "Experiência / Passeio" }, { id: "ingresso", label: "Ingresso" }, { id: "transporte", label: "Transporte" },
    ]},
    { id: "emissivo", label: "✈️ Emissivo", types: [
      { id: "pacote", label: "Pacote" }, { id: "cruzeiro", label: "Cruzeiro" },
    ]},
  ];

  const currentModule = modules.find((m) => m.id === data.product_module);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Vamos criar seu primeiro produto. Você pode pular e criar depois.
      </p>
      <div className="space-y-1.5">
        <Label>Módulo</Label>
        <div className="grid grid-cols-3 gap-2">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => update("product_module", m.id)}
              className={`rounded-lg border p-2 text-sm text-center transition-all ${
                data.product_module === m.id
                  ? "border-sky-500 bg-sky-50 font-medium"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <div className="flex flex-wrap gap-2">
          {currentModule?.types.map((t) => (
            <button
              key={t.id}
              onClick={() => update("product_type", t.id)}
              className={`rounded-full border px-3 py-1 text-sm transition-all ${
                data.product_type === t.id
                  ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Nome do produto</Label>
        <Input
          value={data.product_title}
          onChange={(e) => update("product_title", e.target.value)}
          placeholder="Ex: Passeio de Barco Pôr do Sol"
        />
      </div>
    </div>
  );
}

function StepDominio({ data, update }: {
  data: OnboardingData;
  update: (f: keyof OnboardingData, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
        <p className="text-sm text-sky-800 font-medium">
          Sua loja já vai estar no ar em:
        </p>
        <p className="text-sky-600 font-mono mt-1">
          {data.slug || "suaempresa"}.turiapp.com.br
        </p>
      </div>
      <p className="text-sm text-gray-600">
        Se você já tem um domínio próprio (ex: bolinhatur.com.br), pode vinculá-lo aqui.
        Você vai precisar adicionar um registro DNS — o painel te guia passo a passo.
      </p>
      <div className="space-y-1.5">
        <Label>Domínio próprio <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
        <Input
          value={data.custom_domain}
          onChange={(e) => update("custom_domain", e.target.value)}
          placeholder="www.bolinhatur.com.br"
        />
      </div>
      <p className="text-xs text-gray-400">
        Você pode fazer isso depois em <strong>Configurações → Domínio</strong>.
      </p>
    </div>
  );
}
