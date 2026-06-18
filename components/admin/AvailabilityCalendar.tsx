"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, Lock, Unlock } from "lucide-react";

interface AvailabilityEntry {
  id?: string;
  date: string;
  available_slots: number;
  blocked: boolean;
  note: string | null;
}

interface AvailabilityCalendarProps {
  productId: string;
  tenantId: string;
  initialData: AvailabilityEntry[];
}

function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Fill leading blanks
  for (let i = 0; i < first.getDay(); i++) dates.push(new Date(0));
  for (let d = 1; d <= last.getDate(); d++) dates.push(new Date(year, month, d));
  return dates;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ productId, tenantId, initialData }: AvailabilityCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Local state: date string → entry
  const [data, setData] = useState<Record<string, AvailabilityEntry>>(
    Object.fromEntries(initialData.map((e) => [e.date, e]))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState("");
  const [editBlocked, setEditBlocked] = useState(false);
  const [editNote, setEditNote] = useState("");

  const dates = getMonthDates(year, month);
  const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function selectDate(d: Date) {
    const iso = toISO(d);
    setSelected(iso);
    const entry = data[iso];
    setEditSlots(String(entry?.available_slots ?? 10));
    setEditBlocked(entry?.blocked ?? false);
    setEditNote(entry?.note ?? "");
  }

  function applyEdit() {
    if (!selected) return;
    setData(prev => ({
      ...prev,
      [selected]: {
        date: selected,
        available_slots: parseInt(editSlots) || 0,
        blocked: editBlocked,
        note: editNote || null,
      },
    }));
    setSelected(null);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const entries = Object.values(data);
      const res = await fetch("/api/availability/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, tenant_id: tenantId, entries }),
      });
      if (res.ok) setMessage("Disponibilidade salva com sucesso.");
      else setMessage("Erro ao salvar. Tente novamente.");
    });
  }

  function quickFillMonth(slots: number, blocked: boolean) {
    const updates: Record<string, AvailabilityEntry> = {};
    dates.forEach(d => {
      if (d.getTime() === 0) return;
      const iso = toISO(d);
      if (d < today) return;
      updates[iso] = { date: iso, available_slots: slots, blocked, note: null };
    });
    setData(prev => ({ ...prev, ...updates }));
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" size="sm" onClick={() => quickFillMonth(10, false)}>
          Definir 10 vagas p/ todos os dias
        </Button>
        <Button variant="outline" size="sm" onClick={() => quickFillMonth(0, true)}>
          Bloquear mês inteiro
        </Button>
        <Button variant="outline" size="sm" onClick={() => quickFillMonth(0, false)}>
          Liberar mês (0 vagas)
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <CardTitle className="text-base">
            {MONTH_NAMES[month]} {year}
          </CardTitle>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
            {dates.map((d, i) => {
              if (d.getTime() === 0) return <div key={`blank-${i}`} />;
              const iso = toISO(d);
              const entry = data[iso];
              const isPast = d < today;
              const isSelected = iso === selected;
              const isBlocked = entry?.blocked;
              const slots = entry?.available_slots ?? null;

              return (
                <button
                  key={iso}
                  onClick={() => !isPast && selectDate(d)}
                  disabled={isPast}
                  className={`
                    relative rounded p-1.5 text-xs text-center transition-all border
                    ${isPast ? "opacity-30 cursor-not-allowed bg-gray-50" : "hover:border-sky-300 cursor-pointer"}
                    ${isSelected ? "border-sky-500 bg-sky-50 ring-1 ring-sky-300" : "border-transparent"}
                    ${isBlocked ? "bg-red-50 border-red-200" : ""}
                    ${!isBlocked && slots !== null && slots > 0 ? "bg-green-50 border-green-200" : ""}
                  `}
                >
                  <span className="block font-medium">{d.getDate()}</span>
                  {entry && (
                    <span className={`block text-[10px] mt-0.5 ${isBlocked ? "text-red-500" : "text-green-600"}`}>
                      {isBlocked ? "🔒" : `${slots}v`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-100 border border-green-300 inline-block" /> Disponível</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 border border-red-300 inline-block" /> Bloqueado</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-gray-200 inline-block" /> Sem config</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit panel */}
      {selected && (
        <Card className="border-sky-200 bg-sky-50/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              Editando {new Date(selected + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editBlocked}
                  onChange={e => setEditBlocked(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Bloquear este dia
                </span>
              </label>
            </div>
            {!editBlocked && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 whitespace-nowrap">Vagas disponíveis:</span>
                <Input
                  type="number"
                  min={0}
                  value={editSlots}
                  onChange={e => setEditSlots(e.target.value)}
                  className="w-24 h-8"
                />
              </div>
            )}
            <Input
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Observação (opcional)"
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={applyEdit} style={{ backgroundColor: "#0ea5e9" }}>
                Aplicar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <p className={`text-sm ${message.includes("Erro") ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Salvando..." : "Salvar disponibilidade"}
        </Button>
      </div>
    </div>
  );
}
