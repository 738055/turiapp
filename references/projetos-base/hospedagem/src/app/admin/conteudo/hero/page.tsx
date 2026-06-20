"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Image as ImageIcon } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

const defaults = {
  bg_image_url: "",
  label_localizacao: "Foz do Iguaçu · Paraná · Brasil",
  titulo_linha1: "Natureza que",
  titulo_destaque: "abraça",
  titulo_linha2: "a alma.",
  subtitulo: "Uma experiência sensorial única em meio à Mata Atlântica, a poucos quilômetros das Cataratas do Iguaçu.",
  cta_reserva_texto: "Reservar agora",
  cta_reserva_whatsapp: "5545999999999",
  cta_reserva_mensagem: "Olá, gostaria de fazer uma reserva!",
  cta_secundario_texto: "Ver hospedagens",
  cta_secundario_href: "/#hospedagem",
  stat_1_valor: "4+",    stat_1_label: "Acomodações",
  stat_2_valor: "5★",   stat_2_label: "Avaliações",
  stat_3_valor: "3km",  stat_3_label: "Das Cataratas",
  stat_4_valor: "100%", stat_4_label: "Natureza",
};

export default function HeroAdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaults);

  useEffect(() => {
    fetch("/api/admin/hero")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            bg_image_url:          data.bg_image_url          ?? "",
            label_localizacao:     data.label_localizacao     ?? defaults.label_localizacao,
            titulo_linha1:         data.titulo_linha1         ?? defaults.titulo_linha1,
            titulo_destaque:       data.titulo_destaque       ?? defaults.titulo_destaque,
            titulo_linha2:         data.titulo_linha2         ?? defaults.titulo_linha2,
            subtitulo:             data.subtitulo             ?? defaults.subtitulo,
            cta_reserva_texto:     data.cta_reserva_texto     ?? defaults.cta_reserva_texto,
            cta_reserva_whatsapp:  data.cta_reserva_whatsapp  ?? defaults.cta_reserva_whatsapp,
            cta_reserva_mensagem:  data.cta_reserva_mensagem  ?? defaults.cta_reserva_mensagem,
            cta_secundario_texto:  data.cta_secundario_texto  ?? defaults.cta_secundario_texto,
            cta_secundario_href:   data.cta_secundario_href   ?? defaults.cta_secundario_href,
            stat_1_valor:          data.stat_1_valor          ?? defaults.stat_1_valor,
            stat_1_label:          data.stat_1_label          ?? defaults.stat_1_label,
            stat_2_valor:          data.stat_2_valor          ?? defaults.stat_2_valor,
            stat_2_label:          data.stat_2_label          ?? defaults.stat_2_label,
            stat_3_valor:          data.stat_3_valor          ?? defaults.stat_3_valor,
            stat_3_label:          data.stat_3_label          ?? defaults.stat_3_label,
            stat_4_valor:          data.stat_4_valor          ?? defaults.stat_4_valor,
            stat_4_label:          data.stat_4_label          ?? defaults.stat_4_label,
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
      const payload = { ...form, bg_image_url: form.bg_image_url || null };
      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Hero — Capa do site</h1>
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
            folder="hero"
            label="Foto de fundo do hero (16:9 recomendado)"
            hint="Mínimo 1920×1080px · JPEG/PNG/WebP · Até 10 MB"
          />
          {form.bg_image_url && (
            <div className="mt-3">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>URL da imagem</label>
              <input value={form.bg_image_url} onChange={(e) => set("bg_image_url", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
          )}
        </div>

        {/* Textos */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Textos</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Label de localização</label>
              <input value={form.label_localizacao} onChange={(e) => set("label_localizacao", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              <p className="text-[10px] text-[#1C3A2A]/30 mt-1" style={{ fontFamily: "var(--font-body)" }}>Aparece acima do título em ouro</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título — linha 1</label>
                <input value={form.titulo_linha1} onChange={(e) => set("titulo_linha1", e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Natureza que" />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Palavra em destaque (ouro)</label>
                <input value={form.titulo_destaque} onChange={(e) => set("titulo_destaque", e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="abraça" />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título — linha 2</label>
                <input value={form.titulo_linha2} onChange={(e) => set("titulo_linha2", e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="a alma." />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Subtítulo</label>
              <textarea value={form.subtitulo} onChange={(e) => set("subtitulo", e.target.value)}
                rows={3} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Botões de ação</h2>
          <div className="space-y-5">
            <div className="p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#C4623A] mb-3" style={{ fontFamily: "var(--font-body)" }}>Botão principal (WhatsApp)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Texto do botão</label>
                  <input value={form.cta_reserva_texto} onChange={(e) => set("cta_reserva_texto", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Número WhatsApp (só dígitos)</label>
                  <input value={form.cta_reserva_whatsapp} onChange={(e) => set("cta_reserva_whatsapp", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="5545999999999" />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Mensagem pré-preenchida</label>
                <input value={form.cta_reserva_mensagem} onChange={(e) => set("cta_reserva_mensagem", e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            </div>
            <div className="p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-3" style={{ fontFamily: "var(--font-body)" }}>Botão secundário (link interno)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Texto do botão</label>
                  <input value={form.cta_secundario_texto} onChange={(e) => set("cta_secundario_texto", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Destino (href)</label>
                  <input value={form.cta_secundario_href} onChange={(e) => set("cta_secundario_href", e.target.value)}
                    className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="/#hospedagem" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Estatísticas (barra inferior)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-3" style={{ fontFamily: "var(--font-body)" }}>Stat {n}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Valor</label>
                    <input value={form[`stat_${n}_valor` as keyof typeof form]} onChange={(e) => set(`stat_${n}_valor`, e.target.value)}
                      className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="4+" />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Label</label>
                    <input value={form[`stat_${n}_label` as keyof typeof form]} onChange={(e) => set(`stat_${n}_label`, e.target.value)}
                      className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Acomodações" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
