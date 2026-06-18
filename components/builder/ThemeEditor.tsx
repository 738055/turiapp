"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Theme, MenuType, CardType } from "@/types";
import { Check, Eye, Save } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ThemeEditorProps {
  tenantId: string;
  initialTheme: Theme | null;
  whatsappNumber: string | null;
}

const MENU_OPTIONS: { id: MenuType; label: string; desc: string; preview: string }[] = [
  { id: "top-classic", label: "Topo clássico", desc: "Logo à esquerda, menu à direita", preview: "🔲" },
  { id: "top-centered", label: "Topo centralizado", desc: "Logo e menu centralizados", preview: "⬛" },
  { id: "top-transparent", label: "Transparente", desc: "Menu sobre o banner/hero", preview: "🔳" },
  { id: "sidebar", label: "Lateral", desc: "Menu na barra lateral", preview: "◧" },
];

const CARD_OPTIONS: { id: CardType; label: string; desc: string }[] = [
  { id: "card-image-large", label: "Imagem grande", desc: "Foto em destaque no topo do card" },
  { id: "card-horizontal", label: "Horizontal", desc: "Foto à esquerda, texto à direita" },
  { id: "card-minimal", label: "Minimalista", desc: "Texto em foco, imagem pequena" },
  { id: "card-price-highlight", label: "Preço em destaque", desc: "Preço grande e visível" },
];

const FONT_OPTIONS = [
  { value: '"Inter", system-ui, sans-serif', label: "Inter (moderno)" },
  { value: '"Merriweather", Georgia, serif', label: "Merriweather (elegante)" },
  { value: '"Poppins", system-ui, sans-serif', label: "Poppins (amigável)" },
  { value: '"Playfair Display", Georgia, serif', label: "Playfair Display (luxo)" },
  { value: '"DM Sans", system-ui, sans-serif', label: "DM Sans (clean)" },
];

const RADIUS_OPTIONS = [
  { value: "0px", label: "Quadrado" },
  { value: "0.25rem", label: "Levemente arredondado" },
  { value: "0.5rem", label: "Arredondado" },
  { value: "1rem", label: "Muito arredondado" },
  { value: "9999px", label: "Pill (oval)" },
];

export function ThemeEditor({ tenantId, initialTheme }: ThemeEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(initialTheme?.logo_url ?? null);
  const [theme, setTheme] = useState({
    primary_color: initialTheme?.primary_color ?? "#0ea5e9",
    secondary_color: initialTheme?.secondary_color ?? "#0369a1",
    accent_color: initialTheme?.accent_color ?? "#f59e0b",
    background_color: initialTheme?.background_color ?? "#ffffff",
    text_color: initialTheme?.text_color ?? "#111827",
    font_heading: initialTheme?.font_heading ?? '"Inter", system-ui, sans-serif',
    font_body: initialTheme?.font_body ?? '"Inter", system-ui, sans-serif',
    border_radius: initialTheme?.border_radius ?? "0.5rem",
    menu_type: initialTheme?.menu_type ?? "top-classic",
    card_type: initialTheme?.card_type ?? "card-image-large",
  });

  function update<K extends keyof typeof theme>(key: K, value: (typeof theme)[K]) {
    setTheme((t) => ({ ...t, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/themes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ...theme, logo_url: logoUrl }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const cssVars = {
    "--color-primary": theme.primary_color,
    "--color-secondary": theme.secondary_color,
    "--color-accent": theme.accent_color,
    "--color-background": theme.background_color,
    "--color-text": theme.text_color,
    "--radius": theme.border_radius,
    "--font-heading": theme.font_heading,
    "--font-body": theme.font_body,
  } as React.CSSProperties;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor panels */}
      <div className="lg:col-span-2 space-y-5">

        {/* Logo */}
        <Card>
          <CardHeader><CardTitle className="text-base">🖼️ Logotipo</CardTitle></CardHeader>
          <CardContent>
            <ImageUpload
              tenantId={tenantId}
              folder="logos"
              value={logoUrl}
              onChange={setLogoUrl}
              label="Logo da empresa (PNG com fundo transparente recomendado)"
              aspectRatio="logo"
            />
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader><CardTitle className="text-base">🎨 Cores</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: "primary_color", label: "Cor principal" },
              { key: "secondary_color", label: "Cor secundária" },
              { key: "accent_color", label: "Destaque / botão CTA" },
              { key: "background_color", label: "Fundo da página" },
              { key: "text_color", label: "Cor do texto" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme[key as keyof typeof theme] as string}
                    onChange={(e) => update(key as keyof typeof theme, e.target.value as never)}
                    className="h-9 w-9 rounded cursor-pointer border border-gray-200"
                  />
                  <Input
                    value={theme[key as keyof typeof theme] as string}
                    onChange={(e) => update(key as keyof typeof theme, e.target.value as never)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader><CardTitle className="text-base">✍️ Tipografia</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "font_heading", label: "Fonte dos títulos" },
              { key: "font_body", label: "Fonte do texto" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <select
                  value={theme[key as keyof typeof theme] as string}
                  onChange={(e) => update(key as keyof typeof theme, e.target.value as never)}
                  className="w-full rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}
                      style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Border radius */}
        <Card>
          <CardHeader><CardTitle className="text-base">⬛ Arredondamento dos cantos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => update("border_radius", r.value)}
                  className={`px-4 py-2 border text-sm transition-all ${
                    theme.border_radius === r.value
                      ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ borderRadius: r.value }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu type */}
        <Card>
          <CardHeader><CardTitle className="text-base">🧭 Tipo de menu</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {MENU_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update("menu_type", m.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:border-sky-300 ${
                    theme.menu_type === m.id ? "border-sky-500 bg-sky-50" : "border-gray-200"
                  }`}
                >
                  <div className="text-xl mb-1">{m.preview}</div>
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card type */}
        <Card>
          <CardHeader><CardTitle className="text-base">🃏 Tipo de card de produto</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {CARD_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update("card_type", c.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:border-sky-300 ${
                    theme.card_type === c.id ? "border-sky-500 bg-sky-50" : "border-gray-200"
                  }`}
                >
                  <p className="font-medium text-sm">{c.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="h-4 w-4 mr-1" />
            Pré-visualizar
          </Button>
          <Button onClick={handleSave} disabled={isPending}
            style={{ backgroundColor: "#0ea5e9" }}>
            {saved ? (
              <><Check className="h-4 w-4 mr-1" />Salvo!</>
            ) : (
              <><Save className="h-4 w-4 mr-1" />{isPending ? "Salvando..." : "Salvar aparência"}</>
            )}
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block sticky top-6 self-start">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500">Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              style={{ ...cssVars, fontFamily: theme.font_body }}
              className="text-[var(--color-text)] bg-[var(--color-background)]"
            >
              {/* Mock navbar */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: theme.primary_color }}
              >
                <span className="text-white font-bold text-sm"
                  style={{ fontFamily: theme.font_heading }}>
                  Minha Loja
                </span>
                <div className="flex gap-2">
                  {["Início", "Produtos", "Contato"].map((i) => (
                    <span key={i} className="text-white/80 text-xs">{i}</span>
                  ))}
                </div>
              </div>
              {/* Mock hero */}
              <div className="px-4 py-6 text-center"
                style={{ backgroundColor: theme.primary_color + "22" }}>
                <h2 className="font-bold text-base" style={{ fontFamily: theme.font_heading }}>
                  Bem-vindo à sua loja!
                </h2>
                <p className="text-xs mt-1 text-gray-500">Experiências únicas para você</p>
                <div className="mt-3 inline-block px-4 py-1.5 text-xs text-white font-semibold"
                  style={{
                    backgroundColor: theme.accent_color,
                    borderRadius: theme.border_radius,
                  }}>
                  Ver produtos
                </div>
              </div>
              {/* Mock card grid */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {[1, 2].map((n) => (
                  <div key={n} className="border overflow-hidden"
                    style={{ borderRadius: theme.border_radius }}>
                    <div className="h-16 bg-gray-100" />
                    <div className="p-2">
                      <div className="h-2 bg-gray-200 rounded mb-1" />
                      <div className="h-2 w-2/3 bg-gray-100 rounded" />
                      <div className="mt-1 text-xs font-bold"
                        style={{ color: theme.primary_color }}>
                        R$ 199
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Badge variant="secondary" className="mt-2 text-xs">
          Preview ao vivo
        </Badge>
      </div>
    </div>
  );
}
