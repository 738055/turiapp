"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ZoomIn, SkipForward } from "lucide-react";
import { cropImageToBlob } from "@/lib/crop";

interface CropModalProps {
  imageSrc: string;
  aspect: number;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
  label?: string;
  /** e.g. "2 de 5" — shown when processing multiple files */
  progress?: string;
  /** Called when user wants to skip this file (only shown when provided) */
  onSkipFile?: () => void;
}

export default function CropModal({
  imageSrc,
  aspect,
  onApply,
  onCancel,
  label,
  progress,
  onSkipFile,
}: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      onApply(blob);
    } finally {
      setApplying(false);
    }
  }

  const cancelLabel = onSkipFile ? "Cancelar tudo" : "Cancelar";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0f1e16]/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="bg-white w-full max-w-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C3A2A]/10">
            <div>
              <div className="flex items-center gap-3">
                <p
                  className="text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Ajustar imagem
                </p>
                {progress && (
                  <span
                    className="text-[10px] tracking-wider uppercase px-2 py-0.5 bg-[#B8963E]/10 text-[#B8963E]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {progress}
                  </span>
                )}
              </div>
              {label && (
                <p
                  className="text-sm text-[#1C3A2A] mt-0.5"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {label}
                </p>
              )}
            </div>
            <button
              onClick={onCancel}
              title={cancelLabel}
              className="p-1.5 text-[#1C3A2A]/30 hover:text-[#1C3A2A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cropper */}
          <div className="relative bg-[#1C3A2A]/5" style={{ height: 380 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { borderRadius: 0 },
                cropAreaStyle: { border: "2px solid #B8963E" },
              }}
            />
          </div>

          {/* Controls */}
          <div className="px-6 py-4 border-t border-[#1C3A2A]/10 space-y-3">
            <div className="flex items-center gap-3">
              <ZoomIn
                className="w-4 h-4 text-[#1C3A2A]/40 shrink-0"
                strokeWidth={1.5}
              />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[#C4623A]"
              />
              <span
                className="text-xs text-[#1C3A2A]/40 w-10 text-right"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {zoom.toFixed(1)}×
              </span>
            </div>

            <div className="flex gap-3 justify-end flex-wrap">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 border border-[#1C3A2A]/20 text-sm text-[#1C3A2A]/60 tracking-widest uppercase hover:border-[#1C3A2A]/40 transition-colors"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {cancelLabel}
              </button>

              {onSkipFile && (
                <button
                  type="button"
                  onClick={onSkipFile}
                  className="flex items-center gap-2 px-5 py-2.5 border border-[#1C3A2A]/20 text-sm text-[#1C3A2A]/60 tracking-widest uppercase hover:border-[#B8963E] hover:text-[#B8963E] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <SkipForward className="w-4 h-4" />
                  Pular arquivo
                </button>
              )}

              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C4623A] text-white text-sm tracking-widest uppercase hover:bg-[#d4754e] disabled:opacity-60 transition-colors"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Check className="w-4 h-4" />
                {applying ? "Aplicando…" : "Aplicar crop"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
