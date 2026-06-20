"use client";

import type { CSSProperties } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Mail,
  Megaphone,
  Package,
  Phone,
  Plus,
  Save,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Page, PageSection, SectionType, Theme } from "@/types";

type FieldType = "text" | "textarea" | "select" | "number" | "list" | "faq-list" | "testimonial-list" | "stat-list";
type SectionField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

const SECTION_CATALOG: { type: SectionType; label: string; icon: typeof LayoutTemplate; desc: string }[] = [
  { type: "hero", label: "Banner principal", icon: ImageIcon, desc: "Imagem, chamada e botao principal" },
  { type: "search-bar", label: "Barra de busca", icon: Search, desc: "Busca de produtos e destinos" },
  { type: "product-grid", label: "Grade de produtos", icon: Package, desc: "Vitrine com cards de produtos" },
  { type: "product-carousel", label: "Carrossel", icon: LayoutTemplate, desc: "Destaques em linha horizontal" },
  { type: "banner", label: "Banner promocional", icon: Megaphone, desc: "Chamada rapida com CTA" },
  { type: "testimonials", label: "Depoimentos", icon: Star, desc: "Prova social de clientes" },
  { type: "faq", label: "FAQ", icon: HelpCircle, desc: "Perguntas frequentes" },
  { type: "about", label: "Sobre", icon: Info, desc: "Historia, autoridade e imagem" },
  { type: "contact", label: "Contato", icon: Phone, desc: "Telefone, email e WhatsApp" },
  { type: "newsletter", label: "Newsletter", icon: Mail, desc: "Captura de interessados" },
  { type: "footer", label: "Rodape", icon: AlignLeft, desc: "Texto final e links" },
];

interface PageBuilderProps {
  page: Page & { sections: PageSection[] };
  theme: Theme | null;
  tenantId: string;
  previewUrl?: string | null;
}

export function PageBuilder({ page, theme, tenantId, previewUrl }: PageBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialSections = useMemo(() => [...(page.sections ?? [])].sort((a, b) => a.order - b.order), [page.sections]);
  const [sections, setSections] = useState<PageSection[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [addingSection, setAddingSection] = useState(false);
  const [previewTab, setPreviewTab] = useState<"instant" | "published">("instant");
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());
  const [isDirty, setIsDirty] = useState(false);
  const [pageMeta, setPageMeta] = useState({
    title: page.title,
    seo_title: page.seo_title ?? "",
    seo_description: page.seo_description ?? "",
    show_in_nav: page.show_in_nav,
    status: page.status,
  });

  const activeSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0] ?? null;

  function markDirty() {
    setIsDirty(true);
  }

  function updatePageMeta<K extends keyof typeof pageMeta>(key: K, value: (typeof pageMeta)[K]) {
    setPageMeta((current) => ({ ...current, [key]: value }));
    markDirty();
  }

  function addSection(type: SectionType) {
    const newSection: PageSection = {
      id: crypto.randomUUID(),
      page_id: page.id,
      type,
      order: sections.length,
      visible: true,
      config: getDefaultConfig(type),
    };
    setSections((current) => [...current, newSection]);
    setSelectedSectionId(newSection.id);
    setAddingSection(false);
    setPreviewTab("instant");
    markDirty();
  }

  function toggleVisible(id: string) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, visible: !section.visible } : section))
    );
    markDirty();
  }

  function removeSection(id: string) {
    setSections((current) => {
      const next = current.filter((section) => section.id !== id).map((section, index) => ({ ...section, order: index }));
      if (selectedSectionId === id) setSelectedSectionId(next[0]?.id ?? null);
      return next;
    });
    markDirty();
  }

  function moveSection(id: string, direction: "up" | "down") {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      if (direction === "up" && index === 0) return current;
      if (direction === "down" && index === current.length - 1) return current;
      const next = [...current];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next.map((section, order) => ({ ...section, order }));
    });
    markDirty();
  }

  function updateSectionConfig(id: string, config: Record<string, unknown>) {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, config } : section)));
    setPreviewTab("instant");
    markDirty();
  }

  async function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/pages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          page_id: page.id,
          meta: pageMeta,
          sections: sections.map((section, index) => ({
            ...section,
            order: index,
            config: cleanSectionConfig(section.type, section.config),
          })),
        }),
      });

      if (res.ok) {
        setIsDirty(false);
        setPreviewNonce(Date.now());
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[300px_minmax(0,1fr)_460px]">
      <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
        <PageStructurePanel
          sections={sections}
          selectedSectionId={activeSection?.id ?? null}
          isDirty={isDirty}
          onSelect={setSelectedSectionId}
          onAdd={() => setAddingSection((current) => !current)}
          onToggleVisible={toggleVisible}
          onRemove={removeSection}
          onMoveUp={(id) => moveSection(id, "up")}
          onMoveDown={(id) => moveSection(id, "down")}
        />
        <PageSettingsPanel pageMeta={pageMeta} onChange={updatePageMeta} />
        <Button onClick={handleSave} disabled={isPending || !isDirty} className="w-full" style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : isDirty ? "Salvar alteracoes" : "Tudo salvo"}
        </Button>
      </aside>

      <main className="min-w-0 space-y-4">
        {addingSection && <SectionPalette onAdd={addSection} onClose={() => setAddingSection(false)} />}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4 text-sky-600" />
                  {activeSection ? sectionInfo(activeSection.type).label : "Escolha uma secao"}
                </CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  {activeSection ? sectionInfo(activeSection.type).desc : "Selecione uma secao na estrutura da pagina."}
                </p>
              </div>
              {activeSection && (
                <Badge variant={activeSection.visible ? "secondary" : "outline"} className="text-xs">
                  {activeSection.visible ? "Visivel" : "Oculta"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeSection ? (
              <SectionConfigForm
                section={activeSection}
                onUpdate={(config) => updateSectionConfig(activeSection.id, config)}
              />
            ) : (
              <EmptyEditor onAdd={() => setAddingSection(true)} />
            )}
          </CardContent>
        </Card>
      </main>

      <PreviewPanel
        tab={previewTab}
        onTabChange={setPreviewTab}
        sections={sections}
        selectedSectionId={activeSection?.id ?? null}
        onSelectSection={setSelectedSectionId}
        theme={theme}
        pageTitle={pageMeta.title}
        baseUrl={previewUrl}
        slug={page.slug}
        isHome={page.is_home}
        nonce={previewNonce}
        isDirty={isDirty}
      />
    </div>
  );
}

function PageStructurePanel({
  sections,
  selectedSectionId,
  isDirty,
  onSelect,
  onAdd,
  onToggleVisible,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  sections: PageSection[];
  selectedSectionId: string | null;
  isDirty: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onToggleVisible: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Estrutura</CardTitle>
          <Badge variant={isDirty ? "default" : "secondary"} className="text-[10px]">
            {isDirty ? "Pendente" : "Salvo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {sections.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
              Nenhuma secao ainda.
            </div>
          )}
          {sections.map((section, index) => (
            <SectionListItem
              key={section.id}
              section={section}
              index={index}
              selected={section.id === selectedSectionId}
              onSelect={() => onSelect(section.id)}
              onToggleVisible={() => onToggleVisible(section.id)}
              onRemove={() => onRemove(section.id)}
              onMoveUp={() => onMoveUp(section.id)}
              onMoveDown={() => onMoveDown(section.id)}
            />
          ))}
        </div>
        <Button type="button" variant="outline" className="w-full border-dashed" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Adicionar secao
        </Button>
      </CardContent>
    </Card>
  );
}

function SectionListItem({
  section,
  index,
  selected,
  onSelect,
  onToggleVisible,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: PageSection;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const info = sectionInfo(section.type);
  const Icon = info.icon;

  return (
    <div
      className={`rounded-lg border p-2 transition-colors ${
        selected ? "border-sky-500 bg-sky-50" : "border-gray-200 bg-white hover:border-gray-300"
      } ${section.visible ? "" : "opacity-60"}`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-2 text-left">
        <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300" />
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">{info.label}</span>
          <span className="block truncate text-[11px] text-gray-500">Secao {index + 1}</span>
        </span>
      </button>
      <div className="mt-2 flex justify-end gap-1 border-t border-gray-100 pt-2">
        <IconButton label="Subir" onClick={onMoveUp}>
          <ChevronUp className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Descer" onClick={onMoveDown}>
          <ChevronDown className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label={section.visible ? "Ocultar" : "Mostrar"} onClick={onToggleVisible}>
          {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </IconButton>
        <IconButton label="Remover" onClick={onRemove} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`rounded p-1.5 text-gray-400 transition-colors ${
        danger ? "hover:bg-red-50 hover:text-red-500" : "hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function PageSettingsPanel({
  pageMeta,
  onChange,
}: {
  pageMeta: {
    title: string;
    seo_title: string;
    seo_description: string;
    show_in_nav: boolean;
    status: "draft" | "published";
  };
  onChange: <K extends keyof typeof pageMeta>(key: K, value: (typeof pageMeta)[K]) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-sky-600" />
          Pagina
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Titulo no painel/site</Label>
          <Input value={pageMeta.title} onChange={(event) => onChange("title", event.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Titulo SEO</Label>
          <Input
            value={pageMeta.seo_title}
            onChange={(event) => onChange("seo_title", event.target.value)}
            placeholder="Opcional"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Descricao SEO</Label>
          <textarea
            value={pageMeta.seo_description}
            onChange={(event) => onChange("seo_description", event.target.value)}
            className="h-20 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-xs"
            maxLength={160}
            placeholder="Resumo para Google e compartilhamento"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={pageMeta.show_in_nav}
            onChange={(event) => onChange("show_in_nav", event.target.checked)}
            className="h-4 w-4"
          />
          Mostrar no menu da loja
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange("status", "draft")}
            className={`rounded-md border py-2 text-xs ${
              pageMeta.status === "draft" ? "border-gray-500 bg-gray-100 font-semibold" : "border-gray-200"
            }`}
          >
            Rascunho
          </button>
          <button
            type="button"
            onClick={() => onChange("status", "published")}
            className={`rounded-md border py-2 text-xs ${
              pageMeta.status === "published" ? "border-green-500 bg-green-50 font-semibold text-green-700" : "border-gray-200"
            }`}
          >
            Publicada
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionPalette({ onAdd, onClose }: { onAdd: (type: SectionType) => void; onClose: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-sky-600" />
              Adicionar secao
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">Escolha um bloco pronto e depois ajuste os campos.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {SECTION_CATALOG.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAdd(item.type)}
              className="rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-sky-400 hover:bg-sky-50"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EmptyEditor({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
      <Sparkles className="mb-3 h-8 w-8 text-sky-500" />
      <p className="text-sm font-semibold text-gray-900">Monte a pagina por secoes</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Adicione um bloco pronto, preencha os campos e acompanhe a previsualizacao instantanea.
      </p>
      <Button type="button" className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Adicionar primeira secao
      </Button>
    </div>
  );
}

function SectionConfigForm({
  section,
  onUpdate,
}: {
  section: PageSection;
  onUpdate: (config: Record<string, unknown>) => void;
}) {
  const cfg = section.config ?? {};
  const fields = getSectionFields(section.type);

  function updateField(key: string, value: unknown) {
    onUpdate({ ...cfg, [key]: value });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className={field.type === "textarea" || field.type.includes("list") ? "space-y-1.5 lg:col-span-2" : "space-y-1.5"}>
          <Label className="text-xs">{field.label}</Label>
          {field.type === "text" && (
            <Input
              value={stringFromValue(cfg[field.key])}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="h-9 text-sm"
            />
          )}
          {field.type === "textarea" && (
            <textarea
              value={stringFromValue(cfg[field.key])}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="h-28 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm"
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
            <StatsEditor value={statsFromValue(cfg[field.key])} onChange={(value) => updateField(field.key, value)} />
          )}
          {field.type === "faq-list" && (
            <FaqEditor value={faqFromValue(cfg[field.key])} onChange={(value) => updateField(field.key, value)} />
          )}
          {field.type === "testimonial-list" && (
            <TestimonialsEditor
              value={testimonialsFromValue(cfg[field.key])}
              onChange={(value) => updateField(field.key, value)}
            />
          )}
          {field.type === "select" && (
            <select
              value={stringFromValue(cfg[field.key]) || field.options?.[0]?.value || ""}
              onChange={(event) => updateField(field.key, event.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {field.type === "number" && (
            <Input
              type="number"
              value={numberFromValue(cfg[field.key])}
              onChange={(event) => updateField(field.key, Number(event.target.value))}
              className="h-9 text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewPanel({
  tab,
  onTabChange,
  sections,
  selectedSectionId,
  onSelectSection,
  theme,
  pageTitle,
  baseUrl,
  slug,
  isHome,
  nonce,
  isDirty,
}: {
  tab: "instant" | "published";
  onTabChange: (tab: "instant" | "published") => void;
  sections: PageSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  theme: Theme | null;
  pageTitle: string;
  baseUrl?: string | null;
  slug: string;
  isHome: boolean;
  nonce: number;
  isDirty: boolean;
}) {
  return (
    <aside className="2xl:sticky 2xl:top-4 2xl:self-start">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Preview</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                {tab === "instant" ? "Atualiza enquanto edita." : "Loja publicada apos salvar."}
              </p>
            </div>
            {isDirty && <Badge className="text-[10px]">Nao salvo</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => onTabChange("instant")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${tab === "instant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Instantaneo
            </button>
            <button
              type="button"
              onClick={() => onTabChange("published")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${tab === "published" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Publicado
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tab === "instant" ? (
            <InstantPagePreview
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelectSection={onSelectSection}
              theme={theme}
              pageTitle={pageTitle}
            />
          ) : (
            <RealPagePreview baseUrl={baseUrl} pageTitle={pageTitle} slug={slug} isHome={isHome} nonce={nonce} />
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function InstantPagePreview({
  sections,
  selectedSectionId,
  onSelectSection,
  theme,
  pageTitle,
}: {
  sections: PageSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  theme: Theme | null;
  pageTitle: string;
}) {
  const visibleSections = sections.filter((section) => section.visible);
  const style = {
    "--color-primary": theme?.primary_color ?? "#0ea5e9",
    "--color-secondary": theme?.secondary_color ?? "#0369a1",
    "--color-accent": theme?.accent_color ?? "#f59e0b",
    "--color-background": theme?.background_color ?? "#ffffff",
    "--color-text": theme?.text_color ?? "#111827",
    "--radius": theme?.border_radius ?? "0.75rem",
    "--font-heading": theme?.font_heading ?? '"Inter", system-ui, sans-serif',
    "--font-body": theme?.font_body ?? '"Inter", system-ui, sans-serif',
  } as CSSProperties;

  return (
    <div className="border-t border-gray-100 bg-gray-100 p-3">
      <div className="mb-2 flex items-center gap-1.5 rounded-t-lg bg-white px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 truncate rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">{pageTitle || "Pagina"}</span>
      </div>
      <div className="max-h-[720px] overflow-y-auto rounded-b-lg bg-[var(--color-background)] text-[var(--color-text)]" style={style}>
        {visibleSections.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center px-8 text-center text-sm text-gray-500">
            Adicione ou ative secoes para visualizar a pagina.
          </div>
        ) : (
          visibleSections.map((section) => (
            <div
              key={section.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSection(section.id)}
              onKeyDown={(event) => event.key === "Enter" && onSelectSection(section.id)}
              className={`relative cursor-pointer outline-none ring-inset transition ${
                selectedSectionId === section.id ? "ring-2 ring-sky-500" : "hover:ring-2 hover:ring-sky-200"
              }`}
            >
              <PreviewSection section={section} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PreviewSection({ section }: { section: PageSection }) {
  const cfg = section.config ?? {};

  switch (section.type) {
    case "hero":
      return <HeroPreview cfg={cfg} />;
    case "search-bar":
      return <SearchPreview cfg={cfg} />;
    case "product-grid":
    case "product-carousel":
      return <ProductGridPreview cfg={cfg} carousel={section.type === "product-carousel"} />;
    case "banner":
      return <BannerPreview cfg={cfg} />;
    case "testimonials":
      return <TestimonialsPreview cfg={cfg} />;
    case "faq":
      return <FaqPreview cfg={cfg} />;
    case "about":
      return <AboutPreview cfg={cfg} />;
    case "contact":
      return <ContactPreview cfg={cfg} />;
    case "newsletter":
      return <NewsletterPreview cfg={cfg} />;
    case "footer":
      return <FooterPreview cfg={cfg} />;
    default:
      return <GenericPreview cfg={cfg} type={section.type} />;
  }
}

function HeroPreview({ cfg }: { cfg: Record<string, unknown> }) {
  const title = stringFromValue(cfg.title) || "Titulo principal da sua pagina";
  const subtitle = stringFromValue(cfg.subtitle) || "Subtitulo explicando a oferta para o cliente.";
  const image = stringFromValue(cfg.image_url);
  const stats = statsFromValue(cfg.stats).filter((item) => item.value || item.label);

  return (
    <section
      className="relative min-h-[360px] overflow-hidden bg-[var(--color-secondary)] px-6 py-16 text-white"
      style={{
        backgroundImage: image
          ? `linear-gradient(120deg, rgb(0 0 0 / 0.58), rgb(0 0 0 / 0.18)), url(${image})`
          : "linear-gradient(120deg, var(--color-secondary), var(--color-primary))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 max-w-2xl">
        {stringFromValue(cfg.eyebrow) && <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-white/75">{stringFromValue(cfg.eyebrow)}</p>}
        <h1 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">{subtitle}</p>
        <span className="mt-6 inline-flex rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-white">
          {stringFromValue(cfg.cta_label) || "Ver produtos"}
        </span>
      </div>
      {stats.length > 0 && (
        <div className="relative z-10 mt-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-5">
          {stats.slice(0, 3).map((stat) => (
            <div key={`${stat.value}-${stat.label}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SearchPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <section className="bg-white px-6 py-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <Search className="h-4 w-4 text-[var(--color-primary)]" />
          {stringFromValue(cfg.placeholder) || "Buscar produtos..."}
        </div>
        <span className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-center text-sm font-bold text-white">Buscar</span>
      </div>
    </section>
  );
}

function ProductGridPreview({ cfg, carousel }: { cfg: Record<string, unknown>; carousel: boolean }) {
  const columns = Math.max(2, Math.min(4, numberFromValue(cfg.columns) || 3));
  return (
    <section className="bg-white px-6 py-14">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">Vitrine</p>
        <h2 className="text-3xl font-extrabold text-gray-950">{stringFromValue(cfg.title) || (carousel ? "Destaques" : "Nossos produtos")}</h2>
        {stringFromValue(cfg.subtitle) && <p className="mt-2 text-sm text-gray-500">{stringFromValue(cfg.subtitle)}</p>}
      </div>
      <div className={`grid gap-4 ${carousel ? "grid-cols-[repeat(3,220px)] overflow-hidden" : columns === 4 ? "grid-cols-4" : columns === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {[0, 1, 2, 3].slice(0, carousel ? 3 : columns).map((item) => (
          <div key={item} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200" />
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">Produto</p>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-900">Experiencia cadastrada</p>
              <p className="mt-3 text-lg font-bold text-[var(--color-secondary)]">R$ 199</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <section className="bg-[var(--color-secondary)] px-6 py-12 text-white">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-extrabold">{stringFromValue(cfg.title) || "Chamada especial"}</h2>
        <p className="mt-3 text-white/75">{stringFromValue(cfg.subtitle) || "Use este bloco para uma promocao, pacote ou aviso importante."}</p>
        <span className="mt-5 inline-flex rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 text-sm font-bold">
          {stringFromValue(cfg.cta_label) || "Saiba mais"}
        </span>
      </div>
    </section>
  );
}

function TestimonialsPreview({ cfg }: { cfg: Record<string, unknown> }) {
  const items = testimonialsFromValue(cfg.items);
  const list = items.length ? items : [{ name: "Cliente", rating: 5, text: "Atendimento excelente e experiencia muito bem organizada." }];
  return (
    <section className="bg-gray-50 px-6 py-14">
      <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-950">{stringFromValue(cfg.title) || "O que dizem sobre nos"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {list.slice(0, 3).map((item, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-600">{item.text || "Depoimento do cliente."}</p>
            <p className="mt-4 text-sm font-bold text-gray-900">{item.name || "Cliente"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqPreview({ cfg }: { cfg: Record<string, unknown> }) {
  const items = faqFromValue(cfg.items);
  const list = items.length ? items : [{ question: "Pergunta frequente", answer: "Resposta clara para o cliente." }];
  return (
    <section className="bg-white px-6 py-14">
      <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-950">{stringFromValue(cfg.title) || "Perguntas frequentes"}</h2>
      <div className="space-y-3">
        {list.slice(0, 4).map((item, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-bold text-gray-900">{item.question || "Pergunta"}</p>
            <p className="mt-2 text-sm text-gray-600">{item.answer || "Resposta"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <section className="grid gap-6 bg-white px-6 py-14 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">Sobre</p>
        <h2 className="text-3xl font-extrabold text-gray-950">{stringFromValue(cfg.title) || "Sobre a empresa"}</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">{stringFromValue(cfg.text) || "Conte a historia, diferenciais e autoridade da marca."}</p>
      </div>
      <div className="min-h-52 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200" />
    </section>
  );
}

function ContactPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <section className="bg-gray-50 px-6 py-14">
      <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-950">{stringFromValue(cfg.title) || "Fale conosco"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[stringFromValue(cfg.email) || "email@empresa.com", stringFromValue(cfg.phone) || "(00) 0000-0000", stringFromValue(cfg.whatsapp) || "WhatsApp"].map((item) => (
          <div key={item} className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-semibold text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsletterPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <section className="bg-[var(--color-primary)] px-6 py-12 text-center text-white">
      <h2 className="text-3xl font-extrabold">{stringFromValue(cfg.title) || "Fique por dentro"}</h2>
      <p className="mt-2 text-white/75">{stringFromValue(cfg.subtitle) || "Receba novidades e ofertas."}</p>
      <div className="mx-auto mt-6 flex max-w-md gap-2 rounded-xl bg-white p-2">
        <span className="flex-1 px-3 py-2 text-left text-sm text-gray-400">seu@email.com</span>
        <span className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white">{stringFromValue(cfg.btn_label) || "Inscrever"}</span>
      </div>
    </section>
  );
}

function FooterPreview({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <footer className="bg-gray-950 px-6 py-10 text-white">
      <p className="font-bold">{stringFromValue(cfg.company_name) || "Nome da empresa"}</p>
      <p className="mt-2 max-w-xl text-sm text-white/60">{stringFromValue(cfg.description) || "Descricao curta da empresa e links finais."}</p>
    </footer>
  );
}

function GenericPreview({ cfg, type }: { cfg: Record<string, unknown>; type: string }) {
  return (
    <section className="bg-white px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">{type}</p>
      <h2 className="mt-2 text-2xl font-bold text-gray-950">{stringFromValue(cfg.title) || "Secao"}</h2>
    </section>
  );
}

function RealPagePreview({
  baseUrl,
  pageTitle,
  slug,
  isHome,
  nonce,
}: {
  baseUrl?: string | null;
  pageTitle: string;
  slug: string;
  isHome: boolean;
  nonce: number;
}) {
  const previewSrc = baseUrl ? buildPreviewUrl(baseUrl, slug, isHome, nonce) : null;
  const publicPath = isHome ? "/" : `/${slug}`;

  if (!previewSrc) {
    return (
      <div className="border-t border-gray-100 px-4 py-10 text-center text-sm text-gray-500">
        Configure o slug da loja para visualizar a pagina real aqui.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100">
      <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2">
        <span className="truncate text-xs text-gray-500">{publicPath} - {pageTitle || "Pagina"}</span>
        <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-600">
          Abrir
        </a>
      </div>
      <iframe key={nonce} src={previewSrc} className="h-[720px] w-full bg-white" title={`Preview real de ${pageTitle}`} />
    </div>
  );
}

function buildPreviewUrl(baseUrl: string, slug: string, isHome: boolean, nonce: number): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const path = isHome || !cleanSlug ? "" : `/${cleanSlug}`;
  return `${cleanBase}${path}?preview=${nonce}`;
}

function sectionInfo(type: SectionType) {
  return SECTION_CATALOG.find((item) => item.type === type) ?? { type, label: type, icon: LayoutTemplate, desc: "Secao personalizada" };
}

function getSectionFields(type: SectionType): SectionField[] {
  const map: Partial<Record<SectionType, SectionField[]>> = {
    hero: [
      { key: "variant", label: "Estilo visual", type: "select", options: [
        { value: "classic", label: "Classico" },
        { value: "marketplace", label: "Agencia / receptivo" },
        { value: "editorial", label: "Editorial / hospedagem" },
      ] },
      { key: "eyebrow", label: "Texto pequeno acima do titulo", type: "text", placeholder: "Loja oficial" },
      { key: "title", label: "Titulo principal", type: "text", placeholder: "Bem-vindo a nossa loja" },
      { key: "subtitle", label: "Subtitulo", type: "textarea", placeholder: "Uma linha sobre o que voce oferece" },
      { key: "cta_label", label: "Texto do botao", type: "text", placeholder: "Ver produtos" },
      { key: "cta_href", label: "Link do botao", type: "text", placeholder: "/busca" },
      { key: "image_url", label: "URL da imagem de fundo", type: "text", placeholder: "https://..." },
      { key: "height", label: "Altura", type: "select", options: [
        { value: "sm", label: "Pequena" },
        { value: "md", label: "Media" },
        { value: "lg", label: "Grande" },
        { value: "full", label: "Tela cheia" },
      ] },
      { key: "align", label: "Alinhamento", type: "select", options: [
        { value: "left", label: "Esquerda" },
        { value: "center", label: "Centro" },
        { value: "right", label: "Direita" },
      ] },
      { key: "stats", label: "Indicadores do banner", type: "stat-list" },
    ],
    "product-grid": productSectionFields("Nossos produtos"),
    "product-carousel": productSectionFields("Destaques"),
    "search-bar": [
      { key: "placeholder", label: "Texto da busca", type: "text", placeholder: "Buscar produtos..." },
    ],
    banner: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "subtitle", label: "Subtitulo", type: "text" },
      { key: "cta_label", label: "Texto do botao", type: "text" },
      { key: "cta_href", label: "Link do botao", type: "text" },
      { key: "image_url", label: "URL da imagem", type: "text" },
    ],
    contact: [
      { key: "title", label: "Titulo", type: "text", placeholder: "Fale conosco" },
      { key: "email", label: "E-mail", type: "text" },
      { key: "phone", label: "Telefone", type: "text" },
      { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+5511999999999" },
      { key: "address", label: "Endereco", type: "text" },
    ],
    about: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "text", label: "Texto", type: "textarea" },
      { key: "image_url", label: "URL da imagem", type: "text" },
    ],
    newsletter: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "subtitle", label: "Subtitulo", type: "text" },
      { key: "btn_label", label: "Texto do botao", type: "text", placeholder: "Inscrever" },
    ],
    footer: [
      { key: "company_name", label: "Nome da empresa", type: "text" },
      { key: "description", label: "Descricao curta", type: "textarea" },
    ],
    testimonials: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "items", label: "Depoimentos", type: "testimonial-list" },
    ],
    faq: [
      { key: "title", label: "Titulo", type: "text" },
      { key: "items", label: "Perguntas", type: "faq-list" },
    ],
  };

  return map[type] ?? [{ key: "title", label: "Titulo", type: "text" }];
}

function productSectionFields(defaultTitle: string): SectionField[] {
  return [
    { key: "title", label: "Titulo da secao", type: "text", placeholder: defaultTitle },
    { key: "subtitle", label: "Subtitulo", type: "text", placeholder: "" },
    { key: "module", label: "Filtrar por modulo", type: "select", options: [
      { value: "", label: "Todos" },
      { value: "hospedagem", label: "Hospedagem" },
      { value: "receptivo", label: "Receptivo" },
      { value: "emissivo", label: "Emissivo" },
    ] },
    { key: "limit", label: "Quantidade maxima", type: "number" },
    { key: "columns", label: "Colunas", type: "select", options: [
      { value: "2", label: "2 colunas" },
      { value: "3", label: "3 colunas" },
      { value: "4", label: "4 colunas" },
    ] },
    { key: "variant", label: "Estilo da secao", type: "select", options: [
      { value: "marketplace", label: "Marketplace" },
      { value: "editorial", label: "Editorial" },
    ] },
  ];
}

function getDefaultConfig(type: SectionType): Record<string, unknown> {
  const defaults: Partial<Record<SectionType, Record<string, unknown>>> = {
    hero: { title: "Bem-vindo!", subtitle: "Experiencias selecionadas para voce.", height: "md", align: "center" },
    "product-grid": { title: "Nossos produtos", columns: 3, limit: 6 },
    "product-carousel": { title: "Destaques", limit: 8 },
    "search-bar": { placeholder: "Buscar produtos..." },
    banner: { title: "Promocao especial", subtitle: "Destaque uma oferta ou chamada importante." },
    testimonials: { title: "O que dizem sobre nos", items: [] },
    faq: { title: "Perguntas frequentes", items: [] },
    about: { title: "Sobre nos" },
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
            onChange={(event) => onChange(items.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)))}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
            className="h-9 w-9 rounded-md border text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="mx-auto h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        {addLabel}
      </button>
    </div>
  );
}

function StatsEditor({
  value,
  onChange,
}: {
  value: { value: string; label: string }[];
  onChange: (value: { value: string; label: string }[]) => void;
}) {
  const items = value.length ? value : [{ value: "", label: "" }];
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[120px_minmax(0,1fr)_36px] gap-2">
          <Input value={item.value} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, value: event.target.value }))} placeholder="24h" className="h-9 text-sm" />
          <Input value={item.label} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, label: event.target.value }))} placeholder="suporte ao viajante" className="h-9 text-sm" />
          <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="h-9 rounded-md border text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="mx-auto h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { value: "", label: "" }])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar indicador
      </button>
    </div>
  );
}

function FaqEditor({
  value,
  onChange,
}: {
  value: { question: string; answer: string }[];
  onChange: (value: { question: string; answer: string }[]) => void;
}) {
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
          <Input value={item.question} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, question: event.target.value }))} placeholder="Qual e a politica de cancelamento?" className="mb-2 h-9 text-sm" />
          <textarea value={item.answer} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, answer: event.target.value }))} placeholder="Responda de forma clara para o cliente." className="h-24 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar pergunta
      </button>
    </div>
  );
}

function TestimonialsEditor({
  value,
  onChange,
}: {
  value: { name: string; rating: number; text: string }[];
  onChange: (value: { name: string; rating: number; text: string }[]) => void;
}) {
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
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_90px] gap-2">
            <Input value={item.name} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, name: event.target.value }))} placeholder="Nome do cliente" className="h-9 text-sm" />
            <Input type="number" min={1} max={5} value={item.rating} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, rating: Number(event.target.value) || 5 }))} className="h-9 text-sm" />
          </div>
          <textarea value={item.text} onChange={(event) => onChange(updateArrayItem(items, index, { ...item, text: event.target.value }))} placeholder="Texto do depoimento." className="h-24 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm" />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { name: "", rating: 5, text: "" }])} className="inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-600 hover:border-sky-400 hover:bg-sky-50">
        <Plus className="h-3 w-3" />
        Adicionar depoimento
      </button>
    </div>
  );
}

function updateArrayItem<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, currentIndex) => (currentIndex === index ? value : item));
}

function stringFromValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberFromValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
      return { value: stringFromValue(stat.value), label: stringFromValue(stat.label) };
    })
    .filter((item): item is { value: string; label: string } => !!item);
}

function faqFromValue(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const faq = item as { question?: unknown; answer?: unknown };
      return { question: stringFromValue(faq.question), answer: stringFromValue(faq.answer) };
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
        name: stringFromValue(testimonial.name),
        rating: numberFromValue(testimonial.rating) || 5,
        text: stringFromValue(testimonial.text),
      };
    })
    .filter((item): item is { name: string; rating: number; text: string } => !!item);
}
