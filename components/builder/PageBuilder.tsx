"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Page, PageSection, Theme, SectionType } from "@/types";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Settings2,
} from "lucide-react";

const SECTION_CATALOG: { type: SectionType; label: string; emoji: string; desc: string }[] = [
  { type: "hero", label: "Banner principal", emoji: "🖼️", desc: "Imagem de fundo com texto e botão" },
  { type: "search-bar", label: "Barra de busca", emoji: "🔍", desc: "Campo de busca de produtos" },
  { type: "product-grid", label: "Grade de produtos", emoji: "📦", desc: "Cards de produtos em grade" },
  { type: "product-carousel", label: "Carrossel de produtos", emoji: "🎠", desc: "Produtos em carrossel horizontal" },
  { type: "banner", label: "Banner promocional", emoji: "📢", desc: "Banner com CTA de destaque" },
  { type: "testimonials", label: "Depoimentos", emoji: "⭐", desc: "Avaliações de clientes" },
  { type: "faq", label: "Perguntas frequentes", emoji: "❓", desc: "FAQ com accordion" },
  { type: "about", label: "Sobre nós", emoji: "ℹ️", desc: "Texto e imagem sobre a empresa" },
  { type: "contact", label: "Contato", emoji: "📞", desc: "Telefone, email e WhatsApp" },
  { type: "newsletter", label: "Newsletter", emoji: "📧", desc: "Formulário de inscrição" },
  { type: "footer", label: "Rodapé", emoji: "⬇️", desc: "Links e copyright" },
];

interface PageBuilderProps {
  page: Page & { sections: PageSection[] };
  theme: Theme | null;
  tenantId: string;
}

export function PageBuilder({ page, tenantId }: PageBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sections, setSections] = useState<PageSection[]>(
    [...(page.sections ?? [])].sort((a, b) => a.order - b.order)
  );
  const [addingSection, setAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [pageMeta, setPageMeta] = useState({
    title: page.title,
    seo_title: page.seo_title ?? "",
    seo_description: page.seo_description ?? "",
    show_in_nav: page.show_in_nav,
    status: page.status,
  });

  function addSection(type: SectionType) {
    const newSection: PageSection = {
      id: crypto.randomUUID(),
      page_id: page.id,
      type,
      order: sections.length,
      visible: true,
      config: getDefaultConfig(type),
    };
    setSections((s) => [...s, newSection]);
    setAddingSection(false);
    setEditingSection(newSection.id);
  }

  function toggleVisible(id: string) {
    setSections((s) =>
      s.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec))
    );
  }

  function removeSection(id: string) {
    setSections((s) => s.filter((sec) => sec.id !== id));
  }

  function moveSection(id: string, dir: "up" | "down") {
    setSections((s) => {
      const idx = s.findIndex((sec) => sec.id === id);
      if (dir === "up" && idx === 0) return s;
      if (dir === "down" && idx === s.length - 1) return s;
      const newSections = [...s];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
      return newSections.map((sec, i) => ({ ...sec, order: i }));
    });
  }

  function updateSectionConfig(id: string, config: Record<string, unknown>) {
    setSections((s) =>
      s.map((sec) => (sec.id === id ? { ...sec, config } : sec))
    );
  }

  async function handleSave() {
    startTransition(async () => {
      await fetch("/api/pages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          page_id: page.id,
          meta: pageMeta,
          sections: sections.map((s, i) => ({ ...s, order: i, config: cleanSectionConfig(s.type, s.config) })),
        }),
      });
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section list */}
      <div className="lg:col-span-2 space-y-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isEditing={editingSection === section.id}
            onToggleEdit={() =>
              setEditingSection(editingSection === section.id ? null : section.id)
            }
            onToggleVisible={() => toggleVisible(section.id)}
            onRemove={() => removeSection(section.id)}
            onMoveUp={() => moveSection(section.id, "up")}
            onMoveDown={() => moveSection(section.id, "down")}
            onUpdateConfig={(cfg) => updateSectionConfig(section.id, cfg)}
          />
        ))}

        {/* Add section button */}
        {!addingSection ? (
          <Button variant="outline" className="w-full border-dashed"
            onClick={() => setAddingSection(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar seção
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Escolha o tipo de seção</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SECTION_CATALOG.map((s) => (
                <button
                  key={s.type}
                  onClick={() => addSection(s.type)}
                  className="rounded-lg border border-gray-200 p-3 text-left hover:border-sky-400 hover:bg-sky-50 transition-all"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <p className="text-xs font-semibold mt-1">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </button>
              ))}
              <button
                onClick={() => setAddingSection(false)}
                className="rounded-lg border border-gray-200 p-3 text-left text-gray-400 hover:border-gray-400 text-sm"
              >
                Cancelar
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Page settings */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">⚙️ Configurações da página</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Título da página</Label>
              <Input value={pageMeta.title}
                onChange={(e) => setPageMeta((m) => ({ ...m, title: e.target.value }))}
                className="text-sm h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Título SEO (opcional)</Label>
              <Input value={pageMeta.seo_title}
                onChange={(e) => setPageMeta((m) => ({ ...m, seo_title: e.target.value }))}
                placeholder="Igual ao título se vazio"
                className="text-sm h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição SEO</Label>
              <textarea
                value={pageMeta.seo_description}
                onChange={(e) => setPageMeta((m) => ({ ...m, seo_description: e.target.value }))}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs resize-none h-16"
                placeholder="Descrição para mecanismos de busca (até 160 chars)"
                maxLength={160}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show_in_nav" checked={pageMeta.show_in_nav}
                onChange={(e) => setPageMeta((m) => ({ ...m, show_in_nav: e.target.checked }))}
                className="h-4 w-4" />
              <Label htmlFor="show_in_nav" className="text-xs cursor-pointer">
                Mostrar no menu
              </Label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPageMeta((m) => ({ ...m, status: "draft" }))}
                className={`flex-1 rounded border py-1.5 text-xs ${pageMeta.status === "draft" ? "border-gray-400 bg-gray-100 font-medium" : "border-gray-200"}`}
              >
                Rascunho
              </button>
              <button
                onClick={() => setPageMeta((m) => ({ ...m, status: "published" }))}
                className={`flex-1 rounded border py-1.5 text-xs ${pageMeta.status === "published" ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-gray-200"}`}
              >
                Publicada
              </button>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isPending} className="w-full"
          style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar página"}
        </Button>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  isEditing,
  onToggleEdit,
  onToggleVisible,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdateConfig,
}: {
  section: PageSection;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateConfig: (cfg: Record<string, unknown>) => void;
}) {
  const info = SECTION_CATALOG.find((s) => s.type === section.type);

  return (
    <Card className={section.visible ? "" : "opacity-50"}>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
          <span className="text-lg">{info?.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{info?.label ?? section.type}</p>
            <p className="text-xs text-gray-400 truncate">{info?.desc}</p>
          </div>
          {!section.visible && (
            <Badge variant="secondary" className="text-xs">Oculta</Badge>
          )}
          <div className="flex items-center gap-1">
            <button onClick={onMoveUp} className="p-1 hover:bg-gray-100 rounded">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={onMoveDown} className="p-1 hover:bg-gray-100 rounded">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button onClick={onToggleVisible} className="p-1 hover:bg-gray-100 rounded">
              {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onToggleEdit} className="p-1 hover:bg-gray-100 rounded">
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove}
              className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {isEditing && (
          <SectionConfigForm
            section={section}
            onUpdate={onUpdateConfig}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SectionConfigForm({
  section,
  onUpdate,
}: {
  section: PageSection;
  onUpdate: (cfg: Record<string, unknown>) => void;
}) {
  const [cfg, setCfg] = useState<Record<string, unknown>>(section.config ?? {});

  function updateField(key: string, value: unknown) {
    const newCfg = { ...cfg, [key]: value };
    setCfg(newCfg);
    onUpdate(newCfg);
  }

  const fields = getSectionFields(section.type);

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          {field.type === "text" && (
            <Input
              value={(cfg[field.key] as string) ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm h-8"
            />
          )}
          {field.type === "textarea" && (
            <textarea
              value={(cfg[field.key] as string) ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs resize-none h-20"
            />
          )}
          {field.type === "list" && (
            <StringListEditor
              value={stringListFromValue(cfg[field.key])}
              onChange={(value) => updateField(field.key, value)}
              placeholder={field.placeholder}
              addLabel="Adicionar item"
            />
          )}
          {field.type === "stat-list" && (
            <StatsEditor
              value={statsFromValue(cfg[field.key])}
              onChange={(value) => updateField(field.key, value)}
            />
          )}
          {field.type === "faq-list" && (
            <FaqEditor
              value={faqFromValue(cfg[field.key])}
              onChange={(value) => updateField(field.key, value)}
            />
          )}
          {field.type === "testimonial-list" && (
            <TestimonialsEditor
              value={testimonialsFromValue(cfg[field.key])}
              onChange={(value) => updateField(field.key, value)}
            />
          )}
          {field.type === "select" && (
            <select
              value={(cfg[field.key] as string) ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
            >
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {field.type === "number" && (
            <Input
              type="number"
              value={(cfg[field.key] as number) ?? ""}
              onChange={(e) => updateField(field.key, Number(e.target.value))}
              className="text-sm h-8"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getSectionFields(type: SectionType): Array<{
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "list" | "faq-list" | "testimonial-list" | "stat-list";
  placeholder?: string;
  options?: { value: string; label: string }[];
}> {
  const map: Partial<Record<SectionType, ReturnType<typeof getSectionFields>>> = {
    hero: [
      { key: "variant", label: "Estilo visual", type: "select", options: [
        { value: "classic", label: "Classico" },
        { value: "marketplace", label: "Agencia / receptivo" },
        { value: "editorial", label: "Editorial / hospedagem" },
      ]},
      { key: "eyebrow", label: "Texto pequeno acima do titulo", type: "text", placeholder: "Loja oficial" },
      { key: "title", label: "Título", type: "text", placeholder: "Bem-vindo à nossa loja" },
      { key: "subtitle", label: "Subtítulo", type: "textarea", placeholder: "Uma linha sobre o que você oferece" },
      { key: "cta_label", label: "Texto do botão", type: "text", placeholder: "Ver produtos" },
      { key: "cta_href", label: "Link do botão", type: "text", placeholder: "/busca" },
      { key: "image_url", label: "URL da imagem de fundo", type: "text", placeholder: "https://..." },
      { key: "height", label: "Altura", type: "select", options: [
        { value: "sm", label: "Pequena" },
        { value: "md", label: "Média" },
        { value: "lg", label: "Grande" },
        { value: "full", label: "Tela cheia" },
      ]},
      { key: "align", label: "Alinhamento", type: "select", options: [
        { value: "left", label: "Esquerda" },
        { value: "center", label: "Centro" },
        { value: "right", label: "Direita" },
      ]},
      { key: "stats", label: "Estatisticas (valor | legenda)", type: "stat-list" },
    ],
    "product-grid": [
      { key: "title", label: "Título da seção", type: "text", placeholder: "Nossos produtos" },
      { key: "subtitle", label: "Subtítulo", type: "text", placeholder: "" },
      { key: "module", label: "Filtrar por módulo", type: "select", options: [
        { value: "", label: "Todos" },
        { value: "hospedagem", label: "Hospedagem" },
        { value: "receptivo", label: "Receptivo" },
        { value: "emissivo", label: "Emissivo" },
      ]},
      { key: "limit", label: "Quantidade máxima", type: "number" },
      { key: "columns", label: "Colunas", type: "select", options: [
        { value: "2", label: "2 colunas" },
        { value: "3", label: "3 colunas" },
        { value: "4", label: "4 colunas" },
      ]},
      { key: "variant", label: "Estilo da seção", type: "select", options: [
        { value: "marketplace", label: "Marketplace" },
        { value: "editorial", label: "Editorial" },
      ]},
    ],
    banner: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "text" },
      { key: "cta_label", label: "Texto do botão", type: "text" },
      { key: "cta_href", label: "Link do botão", type: "text" },
      { key: "image_url", label: "URL da imagem", type: "text" },
    ],
    contact: [
      { key: "title", label: "Título", type: "text", placeholder: "Fale conosco" },
      { key: "email", label: "E-mail", type: "text" },
      { key: "phone", label: "Telefone", type: "text" },
      { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+5511999999999" },
      { key: "address", label: "Endereço", type: "text" },
    ],
    about: [
      { key: "title", label: "Título", type: "text" },
      { key: "text", label: "Texto", type: "textarea" },
      { key: "image_url", label: "URL da imagem", type: "text" },
    ],
    newsletter: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "text" },
      { key: "btn_label", label: "Texto do botão", type: "text", placeholder: "Inscrever" },
    ],
    footer: [
      { key: "company_name", label: "Nome da empresa", type: "text" },
      { key: "description", label: "Descrição curta", type: "textarea" },
    ],
    testimonials: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "items", label: "Depoimentos (nome | nota | texto)", type: "testimonial-list" },
    ],
    faq: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "items", label: "Perguntas (pergunta | resposta)", type: "faq-list" },
    ],
  };

  return map[type] ?? [
    { key: "title", label: "Título", type: "text" },
  ];
}

function getDefaultConfig(type: SectionType): Record<string, unknown> {
  const defaults: Partial<Record<SectionType, Record<string, unknown>>> = {
    hero: { title: "Bem-vindo!", height: "md", align: "center" },
    "product-grid": { title: "Nossos produtos", columns: 3, limit: 6 },
    "product-carousel": { title: "Destaques", limit: 8 },
    "search-bar": { placeholder: "Buscar produtos..." },
    banner: { title: "Promoção especial" },
    testimonials: { title: "O que dizem sobre nós", items: [] },
    faq: { title: "Perguntas frequentes", items: [] },
    about: { title: "Sobre nós" },
    contact: { title: "Fale conosco" },
    newsletter: { title: "Fique por dentro!", btn_label: "Inscrever" },
    footer: {},
  };
  return defaults[type] ?? {};
}

function cleanSectionConfig(type: string, config: Record<string, unknown>): Record<string, unknown> {
  const next = { ...config };
  if (Array.isArray(next.stats)) {
    next.stats = statsFromValue(next.stats).filter((item) => item.value.trim() || item.label.trim());
  }
  if (type === "faq" && Array.isArray(next.items)) {
    next.items = faqFromValue(next.items).filter((item) => item.question.trim() || item.answer.trim());
  }
  if (type === "testimonials" && Array.isArray(next.items)) {
    next.items = testimonialsFromValue(next.items).filter((item) => item.name.trim() || item.text.trim());
  }
  return next;
}

function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  addLabel: string;
}) {
  const items = value.length ? value : [""];
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(event) => onChange(items.map((current, currentIndex) => currentIndex === index ? event.target.value : current))}
            placeholder={placeholder}
            className="h-8 text-xs"
          />
          <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="h-8 w-8 rounded border text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="mx-auto h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])} className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        {addLabel}
      </button>
    </div>
  );
}

function StatsEditor({ value, onChange }: { value: { value: string; label: string }[]; onChange: (value: { value: string; label: string }[]) => void }) {
  const items = value.length ? value : [{ value: "", label: "" }];
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[90px_minmax(0,1fr)_32px] gap-2">
          <Input value={item.value} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, value: event.target.value }))} placeholder="24h" className="h-8 text-xs" />
          <Input value={item.label} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, label: event.target.value }))} placeholder="suporte ao viajante" className="h-8 text-xs" />
          <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="h-8 rounded border text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="mx-auto h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { value: "", label: "" }])} className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar estatistica
      </button>
    </div>
  );
}

function FaqEditor({ value, onChange }: { value: { question: string; answer: string }[]; onChange: (value: { question: string; answer: string }[]) => void }) {
  const items = value.length ? value : [{ question: "", answer: "" }];
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-gray-400">Pergunta {index + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Input value={item.question} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, question: event.target.value }))} placeholder="Qual e a politica de cancelamento?" className="mb-2 h-8 text-xs" />
          <textarea value={item.answer} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, answer: event.target.value }))} placeholder="Responda de forma clara para o cliente." className="h-20 w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar pergunta
      </button>
    </div>
  );
}

function TestimonialsEditor({ value, onChange }: { value: { name: string; rating: number; text: string }[]; onChange: (value: { name: string; rating: number; text: string }[]) => void }) {
  const items = value.length ? value : [{ name: "", rating: 5, text: "" }];
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-gray-400">Depoimento {index + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_80px] gap-2">
            <Input value={item.name} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, name: event.target.value }))} placeholder="Nome do cliente" className="h-8 text-xs" />
            <Input type="number" min={1} max={5} value={item.rating} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, rating: Number(event.target.value) || 5 }))} className="h-8 text-xs" />
          </div>
          <textarea value={item.text} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, text: event.target.value }))} placeholder="Texto do depoimento." className="h-20 w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { name: "", rating: 5, text: "" }])} className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar depoimento
      </button>
    </div>
  );
}

function updateArrayItem<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, currentIndex) => currentIndex === index ? value : item);
}

function stringListFromValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function statsFromValue(value: unknown): { value: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const stat = item as { value?: unknown; label?: unknown };
      return { value: typeof stat.value === "string" ? stat.value : "", label: typeof stat.label === "string" ? stat.label : "" };
    })
    .filter((item): item is { value: string; label: string } => !!item);
}

function faqFromValue(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const faq = item as { question?: unknown; answer?: unknown };
      return { question: typeof faq.question === "string" ? faq.question : "", answer: typeof faq.answer === "string" ? faq.answer : "" };
    })
    .filter((item): item is { question: string; answer: string } => !!item);
}

function testimonialsFromValue(value: unknown): { name: string; rating: number; text: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const testimonial = item as { name?: unknown; rating?: unknown; text?: unknown };
      return {
        name: typeof testimonial.name === "string" ? testimonial.name : "",
        rating: typeof testimonial.rating === "number" ? testimonial.rating : 5,
        text: typeof testimonial.text === "string" ? testimonial.text : "",
      };
    })
    .filter((item): item is { name: string; rating: number; text: string } => !!item);
}
