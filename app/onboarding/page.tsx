"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { STORE_TEMPLATE_GROUPS, STORE_TEMPLATES, getStoreTemplate } from "@/lib/store-templates";
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

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";

export default function OnboardingPage() {
  const router = useRouter();
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

  function applyTemplate(templateId: string) {
    const template = getStoreTemplate(templateId);
    setData((d) => ({
      ...d,
      template: template.id,
      primary_color: template.theme.primary_color,
      secondary_color: template.theme.secondary_color,
      accent_color: template.theme.accent_color,
      product_module: template.productDefaults.module,
      product_type: template.productDefaults.type,
      product_title: d.product_title || template.productDefaults.title,
    }));
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
              {step === 2 && <StepModelo data={data} applyTemplate={applyTemplate} />}
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
            .{PLATFORM_HOST}
          </span>
        </div>
        {data.slug && (
          <p className="text-xs text-green-600">
            ✓ Sua loja será: <strong>{data.slug}.{PLATFORM_HOST}</strong>
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
        templateId={data.template}
        primaryColor={data.primary_color}
        secondaryColor={data.secondary_color}
        accentColor={data.accent_color}
        companyName={data.company_name || "Minha Loja"}
      />
    </div>
  );
}

function SitePreview({ templateId, primaryColor, secondaryColor, accentColor, companyName }: {
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string;
}) {
  const template = getStoreTemplate(templateId);
  const hero = template.sections.find((section) => section.type === "hero")?.config ?? {};
  const title = String(hero.title ?? `Bem-vindo a ${companyName}`).replace("{{company_name}}", companyName);
  const subtitle = String(hero.subtitle ?? template.description);
  const imageUrl = typeof hero.image_url === "string" ? hero.image_url : "";
  const radius = template.theme.border_radius;
  const cardLabel = template.category === "hospedagem" ? "Suite premium" : template.category === "emissivo" ? "Pacote completo" : "Passeio destaque";

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 border-b bg-gray-100 px-3 py-1.5">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 truncate rounded bg-white px-2 py-0.5 text-xs text-gray-400">
          {companyName.toLowerCase().replace(/\s+/g, "")}.{PLATFORM_HOST}
        </div>
      </div>
      <div style={{ fontFamily: template.theme.font_body, backgroundColor: template.theme.background_color }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: secondaryColor }}>
          <span className="text-sm font-bold text-white">{companyName}</span>
          <div className="flex gap-3">
            {["Inicio", "Produtos", "Contato"].map((i) => (
              <span key={i} className="text-xs text-white/80">{i}</span>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden px-5 py-10 text-left text-white">
          {imageUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />}
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${secondaryColor}ee, ${primaryColor}66)` }} />
          <div className="relative max-w-sm">
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/70">{template.name}</p>
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: template.theme.font_heading }}>{title}</h2>
            <p className="mt-2 line-clamp-2 text-xs text-white/80">{subtitle}</p>
            <div
              className="mt-3 inline-block px-5 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: accentColor, borderRadius: radius }}
            >
              Ver produtos
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-white p-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="overflow-hidden border" style={{ borderRadius: radius }}>
              <div className="h-12 bg-gray-100" style={{ background: n === 1 ? `${primaryColor}22` : "#f3f4f6" }} />
              <div className="p-2">
                <p className="mb-1 truncate text-[10px] font-semibold text-gray-700">{cardLabel}</p>
                <div className="mb-1.5 h-1.5 w-2/3 rounded bg-gray-100" />
                <div className="text-xs font-bold" style={{ color: primaryColor }}>R$ 199</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepModelo({ data, applyTemplate }: {
  data: OnboardingData;
  applyTemplate: (templateId: string) => void;
}) {
  const selected = getStoreTemplate(data.template);
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Escolha o modelo inicial. Ele vira uma copia editavel da loja.</p>
      <div className="space-y-5">
        {STORE_TEMPLATE_GROUPS.map((group) => {
          const templates = STORE_TEMPLATES.filter((template) => template.category === group.category);
          if (!templates.length) return null;

          return (
            <section key={group.category} className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                <p className="text-xs text-gray-500">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {templates.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => applyTemplate(t.id)}
            className={`rounded-xl border-2 p-4 text-left transition-all hover:border-sky-300 ${
              data.template === t.id ? "border-sky-500 bg-sky-50" : "border-gray-200"
            }`}
          >
            <div className="mb-3 h-16 overflow-hidden rounded-lg" style={{ background: `linear-gradient(135deg, ${t.theme.secondary_color}, ${t.theme.primary_color})` }}>
              <div className="h-full w-full bg-white/10" />
            </div>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">{t.category} · {t.source}</p>
          </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="rounded-xl border border-gray-200 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{selected.name}</p>
            <p className="text-xs text-gray-500">{selected.bestFor.join(" · ")}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] uppercase text-gray-500">{selected.category}</span>
        </div>
        <SitePreview
          templateId={data.template}
          primaryColor={data.primary_color}
          secondaryColor={data.secondary_color}
          accentColor={data.accent_color}
          companyName={data.company_name || "Minha Loja"}
        />
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
          {data.slug || "suaempresa"}.{PLATFORM_HOST}
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
