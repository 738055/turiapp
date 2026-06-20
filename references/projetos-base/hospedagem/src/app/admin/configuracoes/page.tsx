"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, X } from "lucide-react";

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

export default function ConfiguracoesAdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novaRegra, setNovaRegra] = useState("");

  const [form, setForm] = useState({
    nome_site: "",
    tagline: "",
    descricao_site: "",
    telefone: "",
    whatsapp: "",
    email: "",
    endereco: "",
    latitude: "",
    longitude: "",
    horario_checkin: "",
    horario_checkout: "",
    instagram: "",
    facebook: "",
    politica_cancelamento: "",
    regras_casa: [] as string[],
    whatsapp_mensagem_reserva: "",
    whatsapp_mensagem_contato: "",
  });

  useEffect(() => {
    fetch("/api/admin/config-site")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const redes = data.redes_sociais || {};
          setForm({
            nome_site: data.nome_site || "Mimosa Flor",
            tagline: data.tagline || "",
            descricao_site: data.descricao_site || "",
            telefone: data.telefone || "",
            whatsapp: data.whatsapp || "",
            email: data.email || "",
            endereco: data.endereco || "",
            latitude: String(data.latitude || ""),
            longitude: String(data.longitude || ""),
            horario_checkin: data.horario_checkin || "14:00",
            horario_checkout: data.horario_checkout || "11:00",
            instagram: redes.instagram || "",
            facebook: redes.facebook || "",
            politica_cancelamento: data.politica_cancelamento || "",
            regras_casa: data.regras_casa || [],
            whatsapp_mensagem_reserva: data.whatsapp_mensagem_reserva || "",
            whatsapp_mensagem_contato: data.whatsapp_mensagem_contato || "",
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
      const payload = {
        nome_site: form.nome_site,
        tagline: form.tagline,
        descricao_site: form.descricao_site,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        email: form.email,
        endereco: form.endereco,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        horario_checkin: form.horario_checkin,
        horario_checkout: form.horario_checkout,
        redes_sociais: {
          instagram: form.instagram,
          facebook: form.facebook,
        },
        politica_cancelamento: form.politica_cancelamento,
        regras_casa: form.regras_casa,
        whatsapp_mensagem_reserva: form.whatsapp_mensagem_reserva,
        whatsapp_mensagem_contato: form.whatsapp_mensagem_contato,
      };

      const res = await fetch("/api/admin/config-site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao salvar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const adicionarRegra = () => {
    if (!novaRegra.trim()) return;
    setForm({ ...form, regras_casa: [...form.regras_casa, novaRegra.trim()] });
    setNovaRegra("");
  };

  const removerRegra = (i: number) => {
    setForm({ ...form, regras_casa: form.regras_casa.filter((_, idx) => idx !== i) });
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando configurações...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Configurar</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Configurações</h1>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
          style={{ fontFamily: "var(--font-body)" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6" style={{ fontFamily: "var(--font-body)" }}>
          {error}
        </div>
      )}

      <div className="space-y-8 max-w-3xl">
        {/* Identidade */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Identidade do site</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Nome do site", key: "nome_site" },
              { label: "Tagline", key: "tagline" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>{label}</label>
                <input value={form[key as keyof typeof form] as string} onChange={(e) => update(key, e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Descrição do site (rodapé e Schema.org)</label>
            <textarea value={form.descricao_site} onChange={(e) => update("descricao_site", e.target.value)}
              rows={3} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Telefone", key: "telefone" },
              { label: "WhatsApp (somente números)", key: "whatsapp" },
              { label: "E-mail", key: "email" },
              { label: "Endereço completo", key: "endereco" },
              { label: "Latitude", key: "latitude" },
              { label: "Longitude", key: "longitude" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>{label}</label>
                <input value={form[key as keyof typeof form] as string} onChange={(e) => update(key, e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Mensagens WhatsApp */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Mensagens WhatsApp</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Mensagem de reserva</label>
              <input value={form.whatsapp_mensagem_reserva} onChange={(e) => update("whatsapp_mensagem_reserva", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Olá, gostaria de fazer uma reserva!" />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Mensagem de contato</label>
              <input value={form.whatsapp_mensagem_contato} onChange={(e) => update("whatsapp_mensagem_contato", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Olá, gostaria de mais informações." />
            </div>
          </div>
        </div>

        {/* Check-in/out */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Horários</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Check-in</label>
              <input type="time" value={form.horario_checkin} onChange={(e) => update("horario_checkin", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Check-out</label>
              <input type="time" value={form.horario_checkout} onChange={(e) => update("horario_checkout", e.target.value)}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
        </div>

        {/* Redes sociais */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Redes sociais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Instagram (URL completa)", key: "instagram" },
              { label: "Facebook (URL completa)", key: "facebook" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>{label}</label>
                <input value={form[key as keyof typeof form] as string} onChange={(e) => update(key, e.target.value)}
                  className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="https://..." />
              </div>
            ))}
          </div>
        </div>

        {/* Política de cancelamento */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Política de cancelamento</h2>
          <textarea value={form.politica_cancelamento} onChange={(e) => update("politica_cancelamento", e.target.value)}
            rows={4} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
        </div>

        {/* Regras da casa */}
        <div className="bg-white border border-[#1C3A2A]/10 p-8">
          <h2 className="text-[#1C3A2A] text-xl mb-6" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Regras da casa</h2>
          <div className="space-y-2 mb-4">
            {form.regras_casa.map((regra, i) => (
              <div key={i} className="flex items-center justify-between bg-[#FAF7F2] px-4 py-2.5 border border-[#1C3A2A]/10">
                <span className="text-sm text-[#1C3A2A]" style={{ fontFamily: "var(--font-body)" }}>{regra}</span>
                <button type="button" onClick={() => removerRegra(i)} className="text-[#1C3A2A]/30 hover:text-red-500 transition-colors ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {form.regras_casa.length === 0 && (
              <p className="text-[#1C3A2A]/30 text-sm" style={{ fontFamily: "var(--font-body)" }}>Nenhuma regra cadastrada.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={novaRegra}
              onChange={(e) => setNovaRegra(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarRegra())}
              className={inputClass}
              style={{ fontFamily: "var(--font-body)" }}
              placeholder="Ex: Não é permitido fumar..."
            />
            <button type="button" onClick={adicionarRegra}
              className="shrink-0 bg-[#1C3A2A] text-[#FAF7F2] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#2a5540] transition-colors inline-flex items-center gap-1"
              style={{ fontFamily: "var(--font-body)" }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
