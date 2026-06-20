"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

export default function SeoAdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    titulo_padrao: "",
    descricao_padrao: "",
    geo_region: "BR-PR",
    geo_placename: "Foz do Iguaçu, Paraná, Brasil",
    geo_position: "-25.571917;-54.516338",
    google_verification: "",
    bing_verification: "",
    robots_txt: "",
  });

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from("seo_config").select("*").eq("id", 1).single();
      if (data) {
        setForm({
          ...data,
        });
      }
      setFetching(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from("seo_config")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50">Carregando configurações...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1"
            style={{ fontFamily: "var(--font-body)" }}>
            Configurar
          </p>
          <h1 className="text-[#1C3A2A] text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            SEO & Indexação
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      <div className="space-y-8 max-w-3xl">
        {/* Meta padrões */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-[#C4623A]" strokeWidth={1.5} />
            <h2 className="text-[#1C3A2A] text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              Metadados padrão
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Título padrão</label>
              <input
                value={form.titulo_padrao || ""}
                onChange={(e) => setForm({ ...form, titulo_padrao: e.target.value })}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
              <p className="text-[#1C3A2A]/30 text-xs mt-1"
                style={{ fontFamily: "var(--font-body)" }}>
                {form.titulo_padrao?.length || 0}/60 caracteres
              </p>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Meta description padrão</label>
              <textarea
                value={form.descricao_padrao || ""}
                onChange={(e) => setForm({ ...form, descricao_padrao: e.target.value })}
                rows={3}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
              <p className="text-[#1C3A2A]/30 text-xs mt-1"
                style={{ fontFamily: "var(--font-body)" }}>
                {form.descricao_padrao?.length || 0}/160 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* SEO Geográfico */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-5 h-5 text-[#C4623A]" strokeWidth={1.5} />
            <h2 className="text-[#1C3A2A] text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              SEO Geográfico
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "geo.region (ex: BR-PR)", key: "geo_region" },
              { label: "geo.placename", key: "geo_placename" },
              { label: "geo.position (lat;lng)", key: "geo_position" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>{label}</label>
                <input
                  value={form[key as keyof typeof form] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className={inputClass}
                  style={{ fontFamily: "var(--font-body)" }}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-[#FAF7F2] border border-[#1C3A2A]/10">
            <p className="text-[#1C3A2A]/50 text-xs" style={{ fontFamily: "var(--font-body)" }}>
              Estas tags são injetadas automaticamente em todas as páginas do site para melhorar o SEO local.
            </p>
          </div>
        </div>

        {/* Verificação */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Verificação de Webmasters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Google Search Console</label>
              <input
                value={form.google_verification || ""}
                onChange={(e) => setForm({ ...form, google_verification: e.target.value })}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="Cód. de verificação do Google"
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Bing Webmaster</label>
              <input
                value={form.bing_verification || ""}
                onChange={(e) => setForm({ ...form, bing_verification: e.target.value })}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="Cód. de verificação do Bing"
              />
            </div>
          </div>
        </div>

        {/* robots.txt */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            robots.txt
          </h2>
          <textarea
            value={form.robots_txt || ""}
            onChange={(e) => setForm({ ...form, robots_txt: e.target.value })}
            rows={8}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
      </div>
    </div>
  );
}
