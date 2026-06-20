"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import IconPicker, { ICON_MAP } from "./IconPicker";
import { cn } from "@/lib/utils";

export type Amenidade = { icone: string; label: string };

interface AmenidadesEditorProps {
  value: Amenidade[];
  onChange: (v: Amenidade[]) => void;
}

const labelClass = "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";
const inputClass =
  "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";

export default function AmenidadesEditor({ value, onChange }: AmenidadesEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("Wifi");

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    onChange([...value, { icone: newIcon, label }]);
    setNewLabel("");
    setPickerOpen(false);
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  const SelectedIcon = ICON_MAP[newIcon] ?? ICON_MAP["Wifi"];

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {value.map((a, i) => {
            const Icon = ICON_MAP[a.icone] ?? ICON_MAP["Star"];
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F2] border border-[#1C3A2A]/10 group"
              >
                <Icon className="w-4 h-4 text-[#B8963E] shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-[#1C3A2A] flex-1 truncate" style={{ fontFamily: "var(--font-body)" }}>
                  {a.label}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1C3A2A]/30 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="border border-[#1C3A2A]/10 p-4 bg-[#FAF7F2]/50 space-y-3">
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div>
            <label className={labelClass}>Ícone</label>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className={cn(
                "flex items-center gap-2 border border-[#1C3A2A]/20 px-3 py-3 bg-white hover:border-[#C4623A] transition-colors",
                pickerOpen && "border-[#C4623A]"
              )}
            >
              <SelectedIcon className="w-5 h-5 text-[#1C3A2A]" strokeWidth={1.5} />
              <span className="text-xs text-[#1C3A2A]/60">{newIcon}</span>
              <ChevronDown
                className={cn("w-3.5 h-3.5 text-[#1C3A2A]/30 transition-transform", pickerOpen && "rotate-180")}
              />
            </button>
          </div>
          <div>
            <label className={labelClass}>Nome da comodidade</label>
            <input
              className={inputClass}
              placeholder="ex: Wi-Fi de alta velocidade"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            />
          </div>
        </div>

        {pickerOpen && (
          <IconPicker value={newIcon} onChange={(v) => { setNewIcon(v); setPickerOpen(false); }} />
        )}

        <button
          type="button"
          onClick={add}
          disabled={!newLabel.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C3A2A] text-[#FAF7F2] text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-[#2a5040] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar comodidade
        </button>
      </div>
    </div>
  );
}
