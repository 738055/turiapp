"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, GripVertical, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import CropModal from "./CropModal";

interface SortableImageProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
}

function SortableImage({ url, index, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="relative overflow-hidden bg-[#1C3A2A]/5 aspect-[4/3]">
        <Image src={url} alt="" fill className="object-cover" />
        {index === 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#B8963E] px-2 py-0.5">
            <Star className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-body)" }}>
              Capa
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-[#1C3A2A]/0 group-hover:bg-[#1C3A2A]/40 transition-colors" />
        <button
          type="button"
          onClick={() => onRemove(url)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-600 text-white hover:bg-red-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/80 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5 text-[#1C3A2A]" />
        </div>
      </div>
    </div>
  );
}

interface MultiImageUploaderProps {
  aspect?: number;
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function MultiImageUploader({
  aspect = 4 / 3,
  value,
  onChange,
  folder = "hospedagens",
  maxImages = 20,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function readFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) { setError("Apenas JPEG, PNG ou WebP"); return; }
    if (file.size > MAX_BYTES) { setError("Arquivo maior que 10 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setRawSrc(reader.result as string);
    reader.readAsDataURL(file);
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
      onChange([...value, json.url]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id as string);
      const newIndex = value.indexOf(over.id as string);
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  }

  function removeImage(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  const canAdd = value.length < maxImages;

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {value.map((url, i) => (
                <SortableImage key={url} url={url} index={i} onRemove={removeImage} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {canAdd && (
        <div
          className={`border-2 border-dashed cursor-pointer transition-colors p-6 flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-[#C4623A] bg-[#C4623A]/5"
              : "border-[#1C3A2A]/20 hover:border-[#C4623A]/50 bg-[#FAF7F2]/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#C4623A] animate-spin" strokeWidth={1.5} />
          ) : (
            <>
              <Upload className="w-5 h-5 text-[#1C3A2A]/30" strokeWidth={1.5} />
              <p className="text-xs text-[#1C3A2A]/40 text-center" style={{ fontFamily: "var(--font-body)" }}>
                Adicionar foto{value.length > 0 ? ` (${value.length}/${maxImages})` : ""}
              </p>
              <p className="text-[10px] text-[#1C3A2A]/25" style={{ fontFamily: "var(--font-body)" }}>
                A primeira foto é usada como capa. Arraste para reordenar.
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs" style={{ fontFamily: "var(--font-body)" }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }}
      />

      {rawSrc && (
        <CropModal
          imageSrc={rawSrc}
          aspect={aspect}
          onApply={handleCropApply}
          onCancel={() => setRawSrc(null)}
        />
      )}
    </div>
  );
}
