"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Code, Loader2, Pencil, X, Save } from "lucide-react";

interface Script {
  id: number;
  nome: string;
  tipo: "pixel_fb" | "gtag" | "gtm" | "custom";
  posicao: "head" | "body_start" | "body_end";
  conteudo: string;
  ativo: boolean;
}

const tipoLabel: Record<string, string> = {
  pixel_fb: "Meta Pixel",
  gtag: "Google Analytics / Tag",
  gtm: "Google Tag Manager",
  custom: "Script personalizado",
};

const posicaoLabel: Record<string, string> = {
  head: "<head>",
  body_start: "Início do <body>",
  body_end: "Fim do <body>",
};

const inputClass = "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";

export default function MarketingAdminPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [fetching, setFetching] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyScript = {
    nome: "", tipo: "custom" as Script["tipo"],
    posicao: "head" as Script["posicao"], conteudo: "",
  };
  const [form, setForm] = useState(emptyScript);

  useEffect(() => {
    fetch("/api/admin/scripts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setScripts(data);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const toggle = async (script: Script) => {
    const optimistic = scripts.map((s) => s.id === script.id ? { ...s, ativo: !s.ativo } : s);
    setScripts(optimistic);
    await fetch(`/api/admin/scripts/${script.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...script, ativo: !script.ativo }),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Remover script?")) return;
    setScripts(scripts.filter((s) => s.id !== id));
    await fetch(`/api/admin/scripts/${id}`, { method: "DELETE" });
  };

  const startEdit = (script: Script) => {
    setForm({
      nome: script.nome,
      tipo: script.tipo,
      posicao: script.posicao,
      conteudo: script.conteudo,
    });
    setEditingId(script.id);
    setAdding(false);
  };

  const saveEdit = async () => {
    if (!form.nome || !form.conteudo || editingId === null) return;
    setSaving(true);
    const res = await fetch(`/api/admin/scripts/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setScripts(scripts.map((s) => s.id === editingId ? updated : s));
    }
    setEditingId(null);
    setForm(emptyScript);
    setSaving(false);
  };

  const addScript = async () => {
    if (!form.nome || !form.conteudo) return;
    setSaving(true);
    const res = await fetch("/api/admin/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ativo: true }),
    });
    if (res.ok) {
      const created = await res.json();
      setScripts([...scripts, created]);
    }
    setForm(emptyScript);
    setAdding(false);
    setSaving(false);
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
    setForm(emptyScript);
  };

  if (fetching) return <div className="p-8 text-[#1C3A2A]/50" style={{ fontFamily: "var(--font-body)" }}>Carregando scripts...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Rastreamento</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Marketing & Scripts</h1>
        </div>
        <button onClick={() => { setAdding(true); setEditingId(null); setForm(emptyScript); }}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Plus className="w-4 h-4" /> Adicionar script
        </button>
      </div>

      {/* Info */}
      <div className="bg-[#FAF7F2] border border-[#1C3A2A]/10 p-6 mb-8 flex gap-3">
        <Code className="w-5 h-5 text-[#C4623A] shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-[#1C3A2A]/60 text-sm" style={{ fontFamily: "var(--font-body)" }}>
          Os scripts ativos são injetados automaticamente nas páginas públicas do site conforme a posição configurada.
          Ative ou desative sem necessidade de novo deploy.
        </p>
      </div>

      {/* Add / Edit form */}
      {(adding || editingId !== null) && (
        <div className="bg-white border border-[#C4623A]/30 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#1C3A2A] text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              {editingId !== null ? "Editar script" : "Novo script"}
            </h2>
            <button onClick={cancelForm} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2" style={{ fontFamily: "var(--font-body)" }}>Nome</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }} placeholder="Ex: Meta Pixel" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2" style={{ fontFamily: "var(--font-body)" }}>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Script["tipo"] })}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }}>
                {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2" style={{ fontFamily: "var(--font-body)" }}>Posição</label>
              <select value={form.posicao} onChange={(e) => setForm({ ...form, posicao: e.target.value as Script["posicao"] })}
                className={inputClass} style={{ fontFamily: "var(--font-body)" }}>
                {Object.entries(posicaoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2" style={{ fontFamily: "var(--font-body)" }}>Código HTML/JS</label>
            <textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={6} className={`${inputClass} font-mono text-xs`} placeholder="<script>...</script>" />
          </div>
          <div className="flex gap-3">
            <button onClick={editingId !== null ? saveEdit : addScript} disabled={saving}
              className="bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#2a5540] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "var(--font-body)" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingId !== null ? "Salvar alterações" : "Adicionar"}
            </button>
            <button onClick={cancelForm}
              className="border border-[#1C3A2A]/20 text-[#1C3A2A]/60 px-6 py-3 text-xs tracking-widest uppercase hover:border-[#1C3A2A]/40 transition-colors"
              style={{ fontFamily: "var(--font-body)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Scripts list */}
      <div className="space-y-4">
        {scripts.length === 0 && (
          <p className="text-[#1C3A2A]/30 text-sm py-8 text-center" style={{ fontFamily: "var(--font-body)" }}>
            Nenhum script cadastrado.
          </p>
        )}
        {scripts.map((script) => (
          <div key={script.id}
            className={`bg-white border p-6 transition-colors ${script.ativo ? "border-[#1C3A2A]/20" : "border-[#1C3A2A]/10 opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-[#1C3A2A] text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>{script.nome}</h3>
                  <span className="text-[10px] tracking-wider uppercase text-[#C4623A] border border-[#C4623A]/30 px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>
                    {tipoLabel[script.tipo]}
                  </span>
                  <span className="text-[10px] tracking-wider uppercase text-[#1C3A2A]/40 border border-[#1C3A2A]/10 px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>
                    {posicaoLabel[script.posicao]}
                  </span>
                  <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 ${script.ativo ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-[#FAF7F2] text-[#1C3A2A]/40 border border-[#1C3A2A]/10"}`}
                    style={{ fontFamily: "var(--font-body)" }}>
                    {script.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <pre className="text-[10px] text-[#1C3A2A]/30 bg-[#FAF7F2] p-3 overflow-hidden max-h-12 truncate">
                  {script.conteudo}
                </pre>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => startEdit(script)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => toggle(script)} className="text-[#1C3A2A]/40 hover:text-[#1C3A2A] transition-colors" title={script.ativo ? "Desativar" : "Ativar"}>
                  {script.ativo ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => remove(script.id)} className="text-[#1C3A2A]/30 hover:text-red-500 transition-colors" title="Remover">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
