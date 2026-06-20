"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Image as ImageIcon } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

const PAGINAS = [
  { key: "home",         label: "Home",          desc: "Títulos das seções na homepage" },
  { key: "transporte",   label: "Transporte",     desc: "Hero e textos da página de transporte" },
  { key: "experiencias", label: "Experiências",   desc: "Hero e textos da página de experiências" },
  { key: "ambientes",    label: "Ambientes",      desc: "Hero e textos da página de ambientes" },
  { key: "contato",      label: "Contato",        desc: "Hero e textos da página de contato" },
  { key: "hospedagem",   label: "Hospedagem",     desc: "Textos da seção de hospedagem" },
  { key: "localizacao",  label: "Localização",    desc: "Títulos da seção de localização" },
];

interface PaginaForm {
  hero_titulo: string;
  hero_subtitulo: string;
  hero_label: string;
  hero_bg_image_url: string;
  secao_titulo: string;
  secao_subtitulo: string;
  secao_descricao: string;
}

const emptyForm: PaginaForm = {
  hero_titulo: "", hero_subtitulo: "", hero_label: "",
  hero_bg_image_url: "", secao_titulo: "", secao_subtitulo: "", secao_descricao: "",
};

export default function PaginasAdminPage() {
  const [activePagina, setActivePagina] = useState("home");
  const [data, setData] = useState<Record<string, PaginaForm>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results: Record<string, PaginaForm> = {};
      await Promise.all(
        PAGINAS.map(async (p) => {
          try {
            const r = await fetch(`/api/admin/paginas/${p.key}`);
            const d = await r.json();
            results[p.key] = {
              hero_titulo:       d.hero_titulo       || "",
              hero_subtitulo:    d.hero_subtitulo    || "",
              hero_label:        d.hero_label        || "",
              hero_bg_image_url: d.hero_bg_image_url || "",
              secao_titulo:      d.secao_titulo      || "",
              secao_subtitulo:   d.secao_subtitulo   || "",
              secao_descricao:   d.secao_descricao   || "",
            };
          } catch {
            results[p.key] = { ...emptyForm };
          }
        })
      );
      setData(results);
      setFetching(false);
    };
    load();
  }, []);

  const getForm = (key: string): PaginaForm => data[key] || { ...emptyForm };

  const updateField = (pagina: string, field: keyof PaginaForm, value: string) => {
    setData((prev) => ({ ...prev, [pagina]: { ...getForm(pagina), [field]: value } }));
  };

  const savePagina = async (pagina: string) => {
    setLoading((l) => ({ ...l, [pagina]: true }));
    try {
      const payload = getForm(pagina);
      const res = await fetch(`/api/admin/paginas/${pagina}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved((s) => ({ ...s, [pagina]: true }));
        setTimeout(() => setSaved((s) => ({ ...s, [pagina]: false })), 3000);
      }
    } finally {
      setLoading((l) => ({ ...l, [pagina]: false }));
    }
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando...</div>;

  const form = getForm(activePagina);
  const paginaInfo = PAGINAS.find((p) => p.key === activePagina)!;
  const showHero = activePagina !== "home";

  return (
    <div>
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Conteúdo</p>
        <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Textos das páginas</h1>
      </div>

      <div className="flex gap-8">
        {/* Tabs */}
        <div className="w-52 shrink-0">
          <ul className="space-y-0.5">
            {PAGINAS.map((p) => (
              <li key={p.key}>
                <button
                  onClick={() => setActivePagina(p.key)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    activePagina === p.key
                      ? "bg-[#1C3A2A] text-[#FAF7F2]"
                      : "text-[#1C3A2A]/60 hover:text-[#1C3A2A] hover:bg-[#1C3A2A]/5"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[#1C3A2A] text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>{paginaInfo.label}</h2>
              <p className="text-[#1C3A2A]/40 text-xs mt-1" style={{ fontFamily: "var(--font-body)" }}>{paginaInfo.desc}</p>
            </div>
            <button onClick={() => savePagina(activePagina)} disabled={loading[activePagina]}
              className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
              style={{ fontFamily: "var(--font-body)" }}>
              {loading[activePagina] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved[activePagina] ? "Salvo!" : "Salvar"}
            </button>
          </div>

          <div className="space-y-6">
            {/* Hero section (only non-home pages) */}
            {showHero && (
              <div className="bg-white border border-[#1C3A2A]/10 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <ImageIcon className="w-4 h-4 text-[#C4623A]" strokeWidth={1.5} />
                  <h3 className="text-[#1C3A2A] font-medium text-sm tracking-wide" style={{ fontFamily: "var(--font-body)" }}>Seção Hero</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Foto de fundo do hero</label>
                    <ImageUploader
                      aspect={16 / 9}
                      value={form.hero_bg_image_url || undefined}
                      onChange={(url) => updateField(activePagina, "hero_bg_image_url", url || "")}
                      folder={activePagina}
                      hint="Mínimo 1920×400px"
                    />
                    {form.hero_bg_image_url && (
                      <input value={form.hero_bg_image_url} onChange={(e) => updateField(activePagina, "hero_bg_image_url", e.target.value)}
                        className={`${inputClass} mt-2`} style={{ fontFamily: "var(--font-body)" }} placeholder="URL da imagem" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Label (eyebrow)</label>
                      <input value={form.hero_label} onChange={(e) => updateField(activePagina, "hero_label", e.target.value)}
                        className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título principal</label>
                      <input value={form.hero_titulo} onChange={(e) => updateField(activePagina, "hero_titulo", e.target.value)}
                        className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Subtítulo</label>
                    <textarea value={form.hero_subtitulo} onChange={(e) => updateField(activePagina, "hero_subtitulo", e.target.value)}
                      rows={2} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Section text */}
            <div className="bg-white border border-[#1C3A2A]/10 p-6">
              <h3 className="text-[#1C3A2A] font-medium text-sm tracking-wide mb-5" style={{ fontFamily: "var(--font-body)" }}>
                {activePagina === "home" ? "Títulos das seções" : "Texto da seção principal"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título da seção</label>
                  <input value={form.secao_titulo} onChange={(e) => updateField(activePagina, "secao_titulo", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Subtítulo da seção</label>
                  <input value={form.secao_subtitulo} onChange={(e) => updateField(activePagina, "secao_subtitulo", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Descrição / texto adicional</label>
                  <textarea value={form.secao_descricao} onChange={(e) => updateField(activePagina, "secao_descricao", e.target.value)}
                    rows={3} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
