"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2, GripVertical } from "lucide-react";

interface MultiImageUploadProps {
  tenantId: string;
  folder: string;
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
}

export function MultiImageUpload({
  tenantId,
  folder,
  values,
  onChange,
  maxImages = 8,
  label = "Imagens",
}: MultiImageUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList) {
    const remaining = maxImages - values.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    setError(null);
    startTransition(async () => {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" excede 5 MB.`);
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        form.append("tenant_id", tenantId);
        form.append("folder", folder);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const body = await res.json();

        if (!res.ok) {
          setError(body.error ?? "Erro no upload.");
        } else {
          uploaded.push(body.url);
        }
      }
      if (uploaded.length) onChange([...values, ...uploaded]);
    });
  }

  async function removeAt(index: number) {
    const url = values[index];
    const match = url.match(/\/object\/public\/media\/(.+)$/);
    if (match) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: match[1], tenant_id: tenantId }),
      });
    }
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      <div className="grid grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={url} className="relative aspect-square rounded overflow-hidden border bg-gray-50">
            <Image src={url} alt={`Imagem ${i + 1}`} fill className="object-cover" />
            <button
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white shadow border flex items-center justify-center hover:bg-red-50"
            >
              <X className="h-3 w-3 text-gray-600" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded text-[10px] bg-black/50 text-white px-1">
                Capa
              </span>
            )}
          </div>
        ))}

        {values.length < maxImages && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="aspect-square rounded border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-sky-500 transition-colors text-xs"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Adicionar
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
      {values.length > 0 && (
        <p className="text-xs text-gray-400">
          {values.length}/{maxImages} imagens · primeira é a capa
        </p>
      )}
    </div>
  );
}
