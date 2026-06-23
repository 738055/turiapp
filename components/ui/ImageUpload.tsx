"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Film } from "lucide-react";

type AspectRatio = "square" | "wide" | "logo" | "portrait" | "ultrawide";
type MediaKind = "image" | "video";

interface ImageUploadProps {
  tenantId: string;
  folder: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: AspectRatio;
  /** "image" (default) accepts JPEG/PNG/WebP and converts to WebP server-side.
   *  "video" accepts MP4/WebM for hero backgrounds. */
  kind?: MediaKind;
  /** Recommended dimensions shown to the tenant so banners aren't cropped. */
  hint?: string;
}

const ASPECT_CLASS: Record<AspectRatio, string> = {
  square: "aspect-square",
  wide: "aspect-video",
  logo: "aspect-[3/1]",
  portrait: "aspect-[4/5]",
  ultrawide: "aspect-[8/3]",
};

const ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm",
};

export function ImageUpload({
  tenantId,
  folder,
  value,
  onChange,
  label = "Imagem",
  aspectRatio = "wide",
  kind = "image",
  hint,
}: ImageUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = ASPECT_CLASS[aspectRatio];
  const isVideo = kind === "video";
  const defaultHint = isVideo
    ? "MP4 ou WebM · recomendado ate 8 MB, ~10s, 1080p, sem audio"
    : "JPEG, PNG ou WebP · convertido para WebP automaticamente";

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
      {hint && (
        <p className="text-[11px] font-medium text-[var(--color-primary,#0ea5e9)]">{hint}</p>
      )}

      {value ? (
        <div className={`relative ${aspectClass} rounded-[var(--radius,0.5rem)] overflow-hidden border bg-gray-50`}>
          {isVideo ? (
            <video src={value} className="h-full w-full object-cover" muted loop playsInline autoPlay />
          ) : (
            <Image src={value} alt="Upload" fill className="object-cover" />
          )}
          <button
            onClick={handleRemove}
            type="button"
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white shadow border flex items-center justify-center hover:bg-red-50 transition-colors"
            title="Remover"
          >
            <X className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`${aspectClass} cursor-pointer rounded-[var(--radius,0.5rem)] border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/30 transition-colors flex flex-col items-center justify-center gap-2 px-3 text-center text-gray-400 hover:text-sky-500`}
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              {isVideo ? <Film className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
              <p className="text-xs">
                Clique ou arraste {isVideo ? "um video" : "uma imagem"}
                <br />
                <span className="text-gray-300">{defaultHint}</span>
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
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
