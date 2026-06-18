"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";

interface CustomerNotesEditorProps {
  tenantId: string;
  customerId: string;
  initialTags: string[];
  initialNotes: string;
}

export function CustomerNotesEditor({
  tenantId,
  customerId,
  initialTags,
  initialNotes,
}: CustomerNotesEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag() {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) { setTagInput(""); return; }
    setTags((t) => [...t, value]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((t) => t.filter((x) => x !== tag));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/customers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          tenant_id: tenantId,
          tags,
          internal_notes: notes,
        }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error ?? "Erro ao salvar."); return; }
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tags e notas internas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remover tag ${tag}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Adicionar tag e pressionar Enter"
              className="flex-1 rounded-[var(--radius)] border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>Adicionar</Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Notas internas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações visíveis apenas para a equipe..."
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm resize-none h-24"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Salvo com sucesso.</p>}

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#0ea5e9" }}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
