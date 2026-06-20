"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Star, X, Save, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface Dep {
  id: number;
  nome: string;
  origem: string;
  texto: string;
  nota: number;
  estadia: string;
  ativo: boolean;
  ordem: number;
}

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

const empty: Omit<Dep, "id"> = {
  nome: "", origem: "", texto: "", nota: 5, estadia: "", ativo: true, ordem: 0,
};

export default function DepoimentosAdminPage() {
  const [items, setItems] = useState<Dep[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<Dep, "id">>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/depoimentos")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .finally(() => setFetching(false));
  }, []);

  const openNew = () => {
    setForm({ ...empty, ordem: items.length + 1 });
    setEditingId("new");
  };

  const openEdit = (dep: Dep) => {
    setForm({ nome: dep.nome, origem: dep.origem || "", texto: dep.texto, nota: dep.nota ?? 5, estadia: dep.estadia || "", ativo: dep.ativo ?? true, ordem: dep.ordem ?? 0 });
    setEditingId(dep.id);
  };

  const cancelForm = () => { setEditingId(null); setForm(empty); };

  const saveForm = async () => {
    if (!form.nome.trim() || !form.texto.trim()) return;
    setSaving(true);
    if (editingId === "new") {
      const res = await fetch("/api/admin/depoimentos", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setItems([...items, created]);
      }
    } else if (typeof editingId === "number") {
      const res = await fetch(`/api/admin/depoimentos/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(items.map((i) => i.id === editingId ? updated : i));
      }
    }
    setSaving(false);
    cancelForm();
  };

  const toggleAtivo = async (dep: Dep) => {
    const optimistic = items.map((i) => i.id === dep.id ? { ...i, ativo: !i.ativo } : i);
    setItems(optimistic);
    await fetch(`/api/admin/depoimentos/${dep.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dep, ativo: !dep.ativo }),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Remover depoimento?")) return;
    setItems(items.filter((i) => i.id !== id));
    await fetch(`/api/admin/depoimentos/${id}`, { method: "DELETE" });
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Conteúdo</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Depoimentos</h1>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Plus className="w-4 h-4" /> Novo depoimento
        </button>
      </div>

      {/* Form */}
      {editingId !== null && (
        <div className="bg-white border border-[#C4623A]/30 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#1C3A2A] text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              {editingId === "new" ? "Novo depoimento" : "Editar depoimento"}
            </h2>
            <button onClick={cancelForm}><X className="w-5 h-5 text-[#1C3A2A]/40" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Nome</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Cidade / Origem</label>
                <input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="São Paulo, SP" />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Depoimento</label>
              <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} rows={4} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Nota (1-5)</label>
                <select value={form.nota} onChange={(e) => setForm({ ...form, nota: Number(e.target.value) })} className={inputClass} style={{ fontFamily: "var(--font-body)" }}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Estadia (ex: 3 noites · Casa)</label>
                <input value={form.estadia} onChange={(e) => setForm({ ...form, estadia: e.target.value })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>Ordem</label>
                <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
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
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-[#1C3A2A]/30 text-sm py-8 text-center" style={{ fontFamily: "var(--font-body)" }}>Nenhum depoimento cadastrado.</p>
        )}
        {items.map((dep) => (
          <div key={dep.id} className={`bg-white border p-6 transition-colors ${dep.ativo ? "border-[#1C3A2A]/20" : "border-[#1C3A2A]/10 opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-[#1C3A2A] text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>{dep.nome}</h3>
                  {dep.origem && <span className="text-[10px] text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>{dep.origem}</span>}
                  <div className="flex gap-0.5">
                    {[...Array(dep.nota ?? 5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#B8963E] text-[#B8963E]" />)}
                  </div>
                  {dep.estadia && <span className="text-[10px] text-[#1C3A2A]/40 border border-[#1C3A2A]/10 px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>{dep.estadia}</span>}
                </div>
                <p className="text-[#1C3A2A]/60 text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>"{dep.texto}"</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(dep)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => toggleAtivo(dep)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors">
                  {dep.ativo ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => remove(dep.id)} className="text-[#1C3A2A]/30 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
