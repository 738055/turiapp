"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, ToggleLeft, ToggleRight, MapPin, Plane, Car } from "lucide-react";

interface Dist {
  id: number;
  label: string;
  distancia: string;
  tempo_estimado: string;
  tipo_icone: "plane" | "car" | "mappin";
  ativo: boolean;
  ordem: number;
}

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

const iconOptions = [
  { value: "mappin", label: "📍 MapPin", icon: MapPin },
  { value: "plane",  label: "✈️ Avião",  icon: Plane },
  { value: "car",    label: "🚗 Carro",  icon: Car },
];

const emptyForm = { label: "", distancia: "", tempo_estimado: "", tipo_icone: "mappin" as Dist["tipo_icone"], ativo: true, ordem: 0 };

export default function LocalizacaoAdminPage() {
  const [items, setItems] = useState<Dist[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/localizacao")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .finally(() => setFetching(false));
  }, []);

  const openNew = () => {
    setForm({ ...emptyForm, ordem: items.length + 1 });
    setEditingId("new");
  };

  const openEdit = (item: Dist) => {
    setForm({ label: item.label, distancia: item.distancia, tempo_estimado: item.tempo_estimado || "", tipo_icone: item.tipo_icone || "mappin", ativo: item.ativo ?? true, ordem: item.ordem ?? 0 });
    setEditingId(item.id);
  };

  const cancelForm = () => { setEditingId(null); setForm(emptyForm); };

  const saveForm = async () => {
    if (!form.label.trim() || !form.distancia.trim()) return;
    setSaving(true);
    if (editingId === "new") {
      const res = await fetch("/api/admin/localizacao", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) { const created = await res.json(); setItems([...items, created]); }
    } else if (typeof editingId === "number") {
      const res = await fetch(`/api/admin/localizacao/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) { const updated = await res.json(); setItems(items.map((i) => i.id === editingId ? updated : i)); }
    }
    setSaving(false);
    cancelForm();
  };

  const toggleAtivo = async (item: Dist) => {
    setItems(items.map((i) => i.id === item.id ? { ...i, ativo: !i.ativo } : i));
    await fetch(`/api/admin/localizacao/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, ativo: !item.ativo }),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Remover?")) return;
    setItems(items.filter((i) => i.id !== id));
    await fetch(`/api/admin/localizacao/${id}`, { method: "DELETE" });
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Conteúdo</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Localização — Distâncias</h1>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Plus className="w-4 h-4" /> Nova distância
        </button>
      </div>

      <div className="bg-[#FAF7F2] border border-[#1C3A2A]/10 p-4 mb-8 text-sm text-[#1C3A2A]/60" style={{ fontFamily: "var(--font-body)" }}>
        💡 As coordenadas do mapa (lat/lng) são configuradas em <strong>Configurações → Contato</strong>.
      </div>

      {/* Form */}
      {editingId !== null && (
        <div className="bg-white border border-[#C4623A]/30 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#1C3A2A] text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              {editingId === "new" ? "Nova distância" : "Editar distância"}
            </h2>
            <button onClick={cancelForm}><X className="w-5 h-5 text-[#1C3A2A]/40" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Nome do local</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Cataratas do Iguaçu" />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Distância</label>
              <input value={form.distancia} onChange={(e) => setForm({ ...form, distancia: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="8 km" />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Tempo estimado</label>
              <input value={form.tempo_estimado} onChange={(e) => setForm({ ...form, tempo_estimado: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="15 min" />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Ícone</label>
              <select value={form.tipo_icone} onChange={(e) => setForm({ ...form, tipo_icone: e.target.value as Dist["tipo_icone"] })} className={inputClass} style={{ fontFamily: "var(--font-body)" }}>
                {iconOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Ordem</label>
              <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveForm} disabled={saving}
              className="bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#2a5540] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "var(--font-body)" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar
            </button>
            <button onClick={cancelForm} className="border border-[#1C3A2A]/20 text-[#1C3A2A]/60 px-6 py-3 text-xs tracking-widest uppercase hover:border-[#1C3A2A]/40 transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-[#1C3A2A]/30 text-sm py-8 text-center" style={{ fontFamily: "var(--font-body)" }}>Nenhuma distância cadastrada.</p>
        )}
        {items.map((item) => {
          const iconDef = iconOptions.find((o) => o.value === item.tipo_icone) || iconOptions[0];
          const Icon = iconDef.icon;
          return (
            <div key={item.id} className={`bg-white border p-5 transition-colors ${item.ativo ? "border-[#1C3A2A]/20" : "border-[#1C3A2A]/10 opacity-60"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-9 h-9 border border-[#1C3A2A]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#1C3A2A]/50" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1C3A2A] font-medium text-sm" style={{ fontFamily: "var(--font-body)" }}>{item.label}</p>
                    <p className="text-[#1C3A2A]/50 text-xs" style={{ fontFamily: "var(--font-body)" }}>{item.distancia} · {item.tempo_estimado}</p>
                  </div>
                  <span className="text-[10px] text-[#1C3A2A]/30 border border-[#1C3A2A]/10 px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>#{item.ordem}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(item)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => toggleAtivo(item)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors">
                    {item.ativo ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => remove(item.id)} className="text-[#1C3A2A]/30 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
