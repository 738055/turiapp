"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Image as ImageIcon } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

const defaults = {
  bg_image_url: "",
  label: "Pronto para escapar?",
  titulo_linha1: "Sua próxima",
  titulo_destaque: "aventura",
  titulo_linha2: "começa aqui.",
  subtitulo: "Entre em contato agora mesmo via WhatsApp e planeje sua estadia perfeita na Mimosa Flor.",
  btn_primario_texto: "Falar no WhatsApp",
  btn_primario_whatsapp: "5545999999999",
  btn_primario_mensagem: "Olá! Gostaria de verificar a disponibilidade e fazer uma reserva na Mimosa Flor.",
  btn_secundario_texto: "Formulário de contato",
  btn_secundario_href: "/contato",
};

export default function CtaAdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaults);

  useEffect(() => {
    fetch("/api/admin/cta")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            bg_image_url:         data.bg_image_url         ?? "",
            label:                data.label                ?? defaults.label,
            titulo_linha1:        data.titulo_linha1        ?? defaults.titulo_linha1,
            titulo_destaque:      data.titulo_destaque      ?? defaults.titulo_destaque,
            titulo_linha2:        data.titulo_linha2        ?? defaults.titulo_linha2,
            subtitulo:            data.subtitulo            ?? defaults.subtitulo,
            btn_primario_texto:   data.btn_primario_texto   ?? defaults.btn_primario_texto,
            btn_primario_whatsapp: data.btn_primario_whatsapp ?? defaults.btn_primario_whatsapp,
            btn_primario_mensagem: data.btn_primario_mensagem ?? defaults.btn_primario_mensagem,
            btn_secundario_texto:  data.btn_secundario_texto  ?? defaults.btn_secundario_texto,
            btn_secundario_href:   data.btn_secundario_href   ?? defaults.btn_secundario_href,
          });
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bg_image_url: form.bg_image_url || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string | undefined) => setForm({ ...form, [key]: value ?? "" });

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Conteúdo</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>CTA — Seção de ação final</h1>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
          style={{ fontFamily: "var(--font-body)" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6" style={{ fontFamily: "var(--font-body)" }}>{error}</div>
      )}

      <div className="space-y-8 max-w-3xl">
        {/* Foto de fundo */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-5 h-5 text-[#C4623A]" strokeWidth={1.5} />
            <h2 className="text-[#1C3A2A] text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Foto de fundo</h2>
          </div>
          <ImageUploader
            aspect={16 / 9}
            value={form.bg_image_url || undefined}
            onChange={(url) => set("bg_image_url", url)}
            folder="cta"
            hint="Mínimo 1920×1080px"
          />
          {form.bg_image_url && (
            <input value={form.bg_image_url} onChange={(e) => set("bg_image_url", e.target.value)}
              className={`${inputClass} mt-3`} style={{ fontFamily: "var(--font-body)" }} />
          )}
        </div>

        {/* Textos */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Textos</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Label (eyebrow em ouro)</label>
              <input value={form.label} onChange={(e) => set("label", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título — linha 1</label>
                <input value={form.titulo_linha1} onChange={(e) => set("titulo_linha1", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Palavra destaque (itálico)</label>
                <input value={form.titulo_destaque} onChange={(e) => set("titulo_destaque", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título — linha 2</label>
                <input value={form.titulo_linha2} onChange={(e) => set("titulo_linha2", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Subtítulo</label>
              <textarea value={form.subtitulo} onChange={(e) => set("subtitulo", e.target.value)}
                rows={3} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Botões de ação</h2>
          <div className="space-y-5">
            <div className="p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#C4623A] mb-3" style={{ fontFamily: "var(--font-body)" }}>Botão principal (WhatsApp)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Texto</label>
                  <input value={form.btn_primario_texto} onChange={(e) => set("btn_primario_texto", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>WhatsApp (só dígitos)</label>
                  <input value={form.btn_primario_whatsapp} onChange={(e) => set("btn_primario_whatsapp", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Mensagem pré-preenchida</label>
                <input value={form.btn_primario_mensagem} onChange={(e) => set("btn_primario_mensagem", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            </div>
            <div className="p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-3" style={{ fontFamily: "var(--font-body)" }}>Botão secundário (link)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Texto</label>
                  <input value={form.btn_secundario_texto} onChange={(e) => set("btn_secundario_texto", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Destino (href)</label>
                  <input value={form.btn_secundario_href} onChange={(e) => set("btn_secundario_href", e.target.value)} className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="/contato" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
