"use client";

import type { CSSProperties } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { STORE_TEMPLATES, getStoreTemplate, type StoreTemplate, type StoreTemplateTheme } from "@/lib/store-templates";
import type { CardType, MenuType, Theme } from "@/types";
import {
  Check,
  Eye,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Palette,
  Save,
  Sparkles,
  Type,
} from "lucide-react";

interface ThemeEditorProps {
  tenantId: string;
  initialTheme: Theme | null;
  whatsappNumber: string | null;
  tenantName?: string | null;
  tenantSlug?: string | null;
  initialTemplate?: string | null;
  storeUrl?: string | null;
}

type EditableTheme = StoreTemplateTheme;
type ColorKey = "primary_color" | "secondary_color" | "accent_color" | "background_color" | "text_color";

const MENU_OPTIONS: { id: MenuType; label: string; desc: string }[] = [
  { id: "top-classic", label: "Topo classico", desc: "Logo a esquerda e menu a direita" },
  { id: "top-centered", label: "Topo centralizado", desc: "Marca e navegacao no centro" },
  { id: "top-transparent", label: "Transparente", desc: "Menu sobre o hero" },
  { id: "sidebar", label: "Lateral", desc: "Navegacao em barra lateral" },
];

const CARD_OPTIONS: { id: CardType; label: string; desc: string }[] = [
  { id: "card-image-large", label: "Imagem grande", desc: "Foto forte no topo" },
  { id: "card-horizontal", label: "Horizontal", desc: "Foto ao lado do texto" },
  { id: "card-minimal", label: "Minimalista", desc: "Conteudo mais direto" },
  { id: "card-price-highlight", label: "Preco em destaque", desc: "Valor com mais peso visual" },
];

const FONT_OPTIONS = [
  { value: '"Inter", system-ui, sans-serif', label: "Inter" },
  { value: '"DM Sans", system-ui, sans-serif', label: "DM Sans" },
  { value: '"Poppins", system-ui, sans-serif', label: "Poppins" },
  { value: '"Playfair Display", Georgia, serif', label: "Playfair Display" },
  { value: '"Merriweather", Georgia, serif', label: "Merriweather" },
];

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "primary_color", label: "Principal" },
  { key: "secondary_color", label: "Secundaria" },
  { key: "accent_color", label: "CTA" },
  { key: "background_color", label: "Fundo" },
  { key: "text_color", label: "Texto" },
];

const RADIUS_OPTIONS = [
  { value: "0px", label: "Reto" },
  { value: "0.25rem", label: "Editorial" },
  { value: "0.75rem", label: "Moderno" },
  { value: "1rem", label: "Suave" },
];

export function ThemeEditor({
  tenantId,
  initialTheme,
  whatsappNumber,
  tenantName,
  tenantSlug,
  initialTemplate,
  storeUrl,
}: ThemeEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());
  const [logoUrl, setLogoUrl] = useState<string | null>(initialTheme?.logo_url ?? null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate || "turismo-basico");
  const [theme, setTheme] = useState<EditableTheme>({
    primary_color: initialTheme?.primary_color ?? "#0ea5e9",
    secondary_color: initialTheme?.secondary_color ?? "#0369a1",
    accent_color: initialTheme?.accent_color ?? "#f59e0b",
    background_color: initialTheme?.background_color ?? "#ffffff",
    text_color: initialTheme?.text_color ?? "#111827",
    font_heading: initialTheme?.font_heading ?? '"Inter", system-ui, sans-serif',
    font_body: initialTheme?.font_body ?? '"Inter", system-ui, sans-serif',
    border_radius: initialTheme?.border_radius ?? "0.75rem",
    menu_type: initialTheme?.menu_type ?? "top-classic",
    card_type: initialTheme?.card_type ?? "card-image-large",
  });

  const selectedTemplate = useMemo(() => getStoreTemplate(selectedTemplateId), [selectedTemplateId]);
  const previewName = tenantName?.trim() || tenantSlug || "Minha Loja";

  function update<K extends keyof EditableTheme>(key: K, value: EditableTheme[K]) {
    setTheme((current) => ({ ...current, [key]: value }));
    setSavedLabel(null);
  }

  function applyTemplate(templateId: string) {
    const template = getStoreTemplate(templateId);
    setSelectedTemplateId(template.id);
    setTheme({ ...template.theme });
    setSavedLabel(null);
  }

  async function handleSave(applyTemplateToHome: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/themes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...theme,
          logo_url: logoUrl,
          template: selectedTemplateId,
          apply_template: applyTemplateToHome,
        }),
      });

      if (res.ok) {
        setSavedLabel(applyTemplateToHome ? "Modelo aplicado na loja" : "Visual salvo");
        setPreviewNonce(Date.now());
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="h-4 w-4 text-sky-600" />
                  Modelos profissionais
                </CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  Escolha uma base pronta e ajuste cores, fonte e estrutura depois.
                </p>
              </div>
              <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
                {STORE_TEMPLATES.length} modelos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {STORE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`rounded-lg border p-3 text-left transition-all hover:border-sky-300 hover:bg-sky-50/40 ${
                    selectedTemplateId === template.id ? "border-sky-500 bg-sky-50 shadow-sm" : "border-gray-200"
                  }`}
                >
                  <div
                    className="mb-3 h-20 rounded-md bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${template.theme.secondary_color}cc, ${template.theme.primary_color}55), url(${heroImage(template)})`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{template.description}</p>
                    </div>
                    {selectedTemplateId === template.id && <Check className="h-4 w-4 flex-shrink-0 text-sky-600" />}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">
                      {template.category}
                    </span>
                    {template.bestFor.slice(0, 2).map((item) => (
                      <span key={item} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">
                        {item}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-sky-600" />
              Marca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              tenantId={tenantId}
              folder="logos"
              value={logoUrl}
              onChange={(value) => {
                setLogoUrl(value);
                setSavedLabel(null);
              }}
              label="Logo da empresa"
              aspectRatio="logo"
            />
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-sky-600" />
                Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-md border border-gray-200"
                    />
                    <Input
                      value={theme[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4 text-sky-600" />
                Tipografia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "font_heading", label: "Titulos" },
                { key: "font_body", label: "Texto" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <select
                    value={theme[field.key as "font_heading" | "font_body"]}
                    onChange={(event) => update(field.key as "font_heading" | "font_body", event.target.value)}
                    className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="space-y-1.5">
                <Label className="text-xs">Cantos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RADIUS_OPTIONS.map((radius) => (
                    <button
                      key={radius.value}
                      type="button"
                      onClick={() => update("border_radius", radius.value)}
                      className={`border px-3 py-2 text-xs transition-all ${
                        theme.border_radius === radius.value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      style={{ borderRadius: radius.value }}
                    >
                      {radius.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-sky-600" />
              Ajustes finos do layout
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <OptionGroup
              label="Menu"
              value={theme.menu_type}
              options={MENU_OPTIONS}
              onChange={(value) => update("menu_type", value as MenuType)}
            />
            <OptionGroup
              label="Card de produto"
              value={theme.card_type}
              options={CARD_OPTIONS}
              onChange={(value) => update("card_type", value as CardType)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {savedLabel ?? "Alteracoes ainda nao salvas"}
            </p>
            <p className="text-xs text-gray-500">
              Aplicar modelo completo atualiza menu, home e paginas prontas, sem apagar produtos.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => window.open(storeUrl || "/", "_blank")}>
              <Eye className="h-4 w-4" />
              Abrir loja
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={isPending}>
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar visual"}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isPending} style={{ backgroundColor: theme.primary_color }}>
              <Sparkles className="h-4 w-4" />
              {isPending ? "Aplicando..." : "Aplicar modelo completo"}
            </Button>
          </div>
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-3">
          <TemplatePreview
            template={selectedTemplate}
            theme={theme}
            tenantName={previewName}
            logoUrl={logoUrl}
            whatsappNumber={whatsappNumber}
          />
          <Badge variant="secondary" className="text-xs">
            Preview ao vivo
          </Badge>
          {storeUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-xs font-semibold text-gray-500">Loja real</span>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-600">Abrir</a>
              </div>
              <iframe
                key={previewNonce}
                src={`${storeUrl}${storeUrl.includes("?") ? "&" : "?"}preview=${previewNonce}`}
                className="h-[520px] w-full"
                title="Preview da loja real"
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function OptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string; desc: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md border px-3 py-2 text-left transition-all ${
              value === option.id ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{option.label}</p>
            <p className="text-xs text-gray-500">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplatePreview({
  template,
  theme,
  tenantName,
  logoUrl,
  whatsappNumber,
}: {
  template: StoreTemplate;
  theme: EditableTheme;
  tenantName: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
}) {
  const hero = template.sections.find((section) => section.type === "hero")?.config ?? {};
  const title = stringValue(hero.title, template.productDefaults.title);
  const subtitle = stringValue(hero.subtitle, template.description);
  const eyebrow = stringValue(hero.eyebrow, template.name);
  const image = stringValue(hero.image_url, heroImage(template));
  const stats = Array.isArray(hero.stats) ? hero.stats.slice(0, 3) : [];
  const productLabel =
    template.category === "hospedagem"
      ? "Suite vista jardim"
      : template.category === "emissivo"
      ? "Pacote Gramado"
      : "Cataratas com transfer";

  const cssVars = {
    "--color-primary": theme.primary_color,
    "--color-secondary": theme.secondary_color,
    "--color-accent": theme.accent_color,
    "--color-background": theme.background_color,
    "--color-text": theme.text_color,
    "--radius": theme.border_radius,
    "--font-heading": theme.font_heading,
    "--font-body": theme.font_body,
  } as CSSProperties;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-gray-500">Pre-visualizacao</CardTitle>
          <span className="text-[10px] font-medium uppercase text-gray-400">{template.name}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={cssVars} className="bg-[var(--color-background)] text-[var(--color-text)]">
          <div className="flex items-center gap-1.5 border-b border-gray-100 bg-white px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-2 truncate rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
              {tenantName.toLowerCase().replace(/\s+/g, "-")}.turiapp.com.br
            </span>
          </div>

          <div
            className="relative min-h-[290px] overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(120deg, ${theme.secondary_color}f2, ${theme.primary_color}66), url(${image})` }}
          >
            <div
              className={`relative z-10 flex items-center px-5 py-4 text-white ${
                theme.menu_type === "top-centered" ? "justify-center gap-5" : "justify-between"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-7 w-7 rounded bg-white object-contain p-0.5" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-white/15 text-[10px] font-bold">
                    {tenantName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-bold" style={{ fontFamily: theme.font_heading }}>
                  {tenantName}
                </span>
              </div>
              {theme.menu_type !== "sidebar" && (
                <div className="flex gap-2 text-[10px] font-medium text-white/80">
                  <span>Inicio</span>
                  <span>Produtos</span>
                  <span>Contato</span>
                </div>
              )}
            </div>

            <div className="relative z-10 px-5 pb-7 pt-7 text-white">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">{eyebrow}</p>
              <h2 className="max-w-sm text-2xl font-bold leading-tight" style={{ fontFamily: theme.font_heading }}>
                {title}
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/80">{subtitle}</p>
              <div
                className="mt-4 inline-flex px-4 py-2 text-xs font-bold"
                style={{ backgroundColor: theme.accent_color, borderRadius: theme.border_radius }}
              >
                Ver produtos
              </div>
            </div>

            {stats.length > 0 && (
              <div className="absolute bottom-3 left-5 right-5 z-10 grid grid-cols-3 gap-2">
                {stats.map((item, index) => {
                  const stat = item as { value?: unknown; label?: unknown };
                  return (
                    <div key={index} className="rounded-md bg-white/90 p-2 text-gray-900 shadow-sm">
                      <p className="text-xs font-bold">{stringValue(stat.value, "24h")}</p>
                      <p className="truncate text-[9px] text-gray-500">{stringValue(stat.label, "suporte")}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400">Destaques</p>
                <h3 className="text-sm font-bold" style={{ fontFamily: theme.font_heading }}>
                  {template.category === "hospedagem" ? "Acomodacoes" : "Produtos em destaque"}
                </h3>
              </div>
              {whatsappNumber && <span className="text-[10px] font-medium text-green-600">WhatsApp ativo</span>}
            </div>
            <div className={theme.card_type === "card-horizontal" ? "space-y-2" : "grid grid-cols-2 gap-2"}>
              {[0, 1].map((item) => (
                <PreviewProductCard
                  key={item}
                  cardType={theme.card_type}
                  radius={theme.border_radius}
                  primaryColor={theme.primary_color}
                  title={productLabel}
                  template={template}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewProductCard({
  cardType,
  radius,
  primaryColor,
  title,
  template,
}: {
  cardType: CardType;
  radius: string;
  primaryColor: string;
  title: string;
  template: StoreTemplate;
}) {
  const imageClass = cardType === "card-horizontal" ? "h-20 w-24 flex-shrink-0" : "h-24 w-full";
  const content = (
    <div className="min-w-0 p-2">
      <p className="truncate text-[11px] font-semibold text-gray-800">{title}</p>
      <p className="mt-1 truncate text-[10px] text-gray-400">{template.productDefaults.extra_data.duration as string}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold" style={{ color: primaryColor }}>
          R$ 199
        </span>
        {cardType === "card-price-highlight" && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">ver</span>}
      </div>
    </div>
  );

  if (cardType === "card-minimal") {
    return (
      <div className="border bg-white p-3 shadow-sm" style={{ borderRadius: radius }}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden border bg-white shadow-sm ${cardType === "card-horizontal" ? "flex" : ""}`}
      style={{ borderRadius: radius }}
    >
      <div className={`${imageClass} bg-cover bg-center`} style={{ backgroundImage: `url(${heroImage(template)})` }} />
      {content}
    </div>
  );
}

function heroImage(template: StoreTemplate): string {
  const hero = template.sections.find((section) => section.type === "hero")?.config ?? {};
  return stringValue(hero.image_url, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80");
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
