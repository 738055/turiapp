"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import CropModal from "./CropModal";

interface ImageUploaderProps {
  aspect: number;
  value?: string;
  onChange: (url: string | undefined) => void;
  folder?: string;
  label?: string;
  hint?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  aspect,
  value,
  onChange,
  folder = "library",
  label,
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function readFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Apenas JPEG, PNG ou WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo maior que 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRawSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  async function handleCropApply(blob: Blob) {
    setRawSrc(null);
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, `image-${Date.now()}.webp`);
      formData.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar");
      onChange(json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!value) return;
    onChange(undefined);
  }

  if (value) {
    return (
      <div className="relative group">
        <div className="relative overflow-hidden bg-[#1C3A2A]/5" style={{ paddingBottom: `${(1 / aspect) * 100}%` }}>
          <Image src={value} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#1C3A2A]/0 group-hover:bg-[#1C3A2A]/40 transition-colors flex items-center justify-center">
            <button
              type="button"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 text-white hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hint && <p className="text-[10px] text-[#1C3A2A]/30 mt-1" style={{ fontFamily: "var(--font-body)" }}>{hint}</p>}
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-[#C4623A] bg-[#C4623A]/5"
            : "border-[#1C3A2A]/20 hover:border-[#C4623A]/50 bg-[#FAF7F2]/50"
        }`}
        style={{ paddingBottom: `${(1 / aspect) * 100}%` }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#C4623A] animate-spin" strokeWidth={1.5} />
          ) : (
            <>
              <Upload className="w-6 h-6 text-[#1C3A2A]/30" strokeWidth={1.5} />
              <p className="text-xs text-[#1C3A2A]/40 text-center px-4" style={{ fontFamily: "var(--font-body)" }}>
                {label ?? "Arraste ou clique para enviar"}
              </p>
              {hint && <p className="text-[10px] text-[#1C3A2A]/30 text-center px-4">{hint}</p>}
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1" style={{ fontFamily: "var(--font-body)" }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {rawSrc && (
        <CropModal
          imageSrc={rawSrc}
          aspect={aspect}
          label={label}
          onApply={handleCropApply}
          onCancel={() => { setRawSrc(null); if (inputRef.current) inputRef.current.value = ""; }}
        />
      )}
    </>
  );
}
