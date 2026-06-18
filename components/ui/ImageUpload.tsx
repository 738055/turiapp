"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  tenantId: string;
  folder: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: "square" | "wide" | "logo";
}

export function ImageUpload({
  tenantId,
  folder,
  value,
  onChange,
  label = "Imagem",
  aspectRatio = "wide",
}: ImageUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = {
    square: "aspect-square",
    wide: "aspect-video",
    logo: "aspect-[3/1]",
  }[aspectRatio];

  function handleFile(file: File) {
    setError(null);
    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("tenant_id", tenantId);
      form.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Erro ao fazer upload.");
        return;
      }
      onChange(body.url);
    });
  }

  async function handleRemove() {
    if (!value) return;
    // Extract path from URL: everything after /object/public/media/
    const match = value.match(/\/object\/public\/media\/(.+)$/);
    if (match) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: match[1], tenant_id: tenantId }),
      });
    }
    onChange(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {value ? (
        <div className={`relative ${aspectClass} rounded-[var(--radius,0.5rem)] overflow-hidden border bg-gray-50`}>
          <Image src={value} alt="Upload" fill className="object-contain p-1" />
          <button
            onClick={handleRemove}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white shadow border flex items-center justify-center hover:bg-red-50 transition-colors"
            title="Remover imagem"
          >
            <X className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`${aspectClass} cursor-pointer rounded-[var(--radius,0.5rem)] border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/30 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-sky-500`}
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <p className="text-xs text-center">
                Clique ou arraste uma imagem<br />
                <span className="text-gray-300">JPEG, PNG, WebP · máx. 5 MB</span>
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
