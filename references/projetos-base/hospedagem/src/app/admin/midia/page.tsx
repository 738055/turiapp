"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import CropModal from "@/components/admin/CropModal";
import { ToastWrapper } from "@/components/admin/Toast";

type MediaFile = { url: string; path: string; name: string; size: number };

const FOLDERS = [
  { value: "library", label: "Biblioteca" },
  { value: "hospedagens", label: "Hospedagens" },
  { value: "servicos", label: "Serviços" },
  { value: "transporte", label: "Transporte" },
];

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function MidiaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folder, setFolder] = useState("library");
  const [loading, setLoading] = useState(false);
  /** Number of uploads currently in-flight (allows parallel uploads) */
  const [uploadCount, setUploadCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Crop modal state for the current file
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | undefined>();

  // Multi-file queue
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  /** Total files in the current batch (for progress display) */
  const [queueTotal, setQueueTotal] = useState(0);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/midia?folder=${folder}`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /** Load a single file into the crop modal via FileReader */
  function loadFileToCrop(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setPendingName(file.name);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Validate incoming files and add them to the queue.
   * If no crop modal is currently open, immediately loads the first file.
   */
  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    const valid: File[] = [];

    for (const file of arr) {
      if (!ALLOWED.includes(file.type)) {
        setToast({ message: `${file.name}: apenas JPEG, PNG ou WebP`, type: "error" });
        continue;
      }
      if (file.size > MAX_BYTES) {
        setToast({ message: `${file.name}: arquivo maior que 10 MB`, type: "error" });
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    if (!rawSrc) {
      // No modal open → start new batch immediately
      loadFileToCrop(valid[0]);
      setFileQueue(valid.slice(1));
      setQueueTotal(valid.length);
    } else {
      // Modal is open → append to queue and extend the batch total
      setFileQueue((prev) => [...prev, ...valid]);
      setQueueTotal((prev) => prev + valid.length);
    }
  }

  /**
   * Advance to the next file in the queue.
   * If queue is empty, closes the modal.
   */
  function advanceQueue(currentQueue: File[], currentTotal: number) {
    const [next, ...rest] = currentQueue;
    if (next) {
      setFileQueue(rest);
      loadFileToCrop(next); // rawSrc will update async → modal remounts via key
    } else {
      // Batch complete
      setRawSrc(null);
      setPendingName(undefined);
      setFileQueue([]);
      setQueueTotal(0);
    }
  }

  /** Upload a blob in the background (fire-and-forget) */
  async function uploadBlob(blob: Blob) {
    setUploadCount((c) => c + 1);
    try {
      const formData = new FormData();
      formData.append("file", blob, `image-${Date.now()}.webp`);
      formData.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar");
      setToast({ message: "Imagem enviada com sucesso!", type: "success" });
      fetchFiles();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao enviar",
        type: "error",
      });
    } finally {
      setUploadCount((c) => c - 1);
    }
  }

  async function handleCropApply(blob: Blob) {
    // Capture queue state synchronously before any async work
    const currentQueue = fileQueue;
    const currentTotal = queueTotal;

    advanceQueue(currentQueue, currentTotal);
    uploadBlob(blob); // parallel upload, don't await
  }

  function handleCropCancel() {
    // Cancel entire remaining batch
    setRawSrc(null);
    setPendingName(undefined);
    setFileQueue([]);
    setQueueTotal(0);
  }

  function handleSkipFile() {
    // Skip current file (don't upload), proceed to next
    advanceQueue(fileQueue, queueTotal);
  }

  async function handleDelete(path: string) {
    if (!confirm("Remover esta imagem do storage?")) return;
    try {
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error("Erro ao remover");
      setFiles((prev) => prev.filter((f) => f.path !== path));
      setToast({ message: "Imagem removida", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erro", type: "error" });
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  // "2 de 5" — only shown when batch has more than one file
  const currentIndex = queueTotal - fileQueue.length;
  const progress = queueTotal > 1 ? `${currentIndex} de ${queueTotal}` : undefined;

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p
              className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Gerenciar
            </p>
            <h1
              className="text-[#1C3A2A] text-4xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Biblioteca de mídia
            </h1>
          </div>
          <button
            onClick={fetchFiles}
            title="Recarregar"
            className="p-2 border border-[#1C3A2A]/20 text-[#1C3A2A]/50 hover:border-[#C4623A] hover:text-[#C4623A] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Folder filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FOLDERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFolder(f.value)}
              className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                folder === f.value
                  ? "bg-[#1C3A2A] text-[#FAF7F2]"
                  : "border border-[#1C3A2A]/20 text-[#1C3A2A]/60 hover:border-[#1C3A2A]/40"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed cursor-pointer transition-colors mb-4 p-10 flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? "border-[#C4623A] bg-[#C4623A]/5"
              : "border-[#1C3A2A]/20 hover:border-[#C4623A]/50 bg-[#FAF7F2]/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) {
              addFiles(e.dataTransfer.files);
            }
          }}
        >
          {uploadCount > 0 ? (
            <>
              <Loader2
                className="w-8 h-8 text-[#C4623A] animate-spin"
                strokeWidth={1.5}
              />
              <p
                className="text-sm text-[#1C3A2A]/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Enviando {uploadCount > 1 ? `${uploadCount} imagens` : "imagem"}…
              </p>
            </>
          ) : (
            <>
              <Upload
                className="w-8 h-8 text-[#1C3A2A]/25"
                strokeWidth={1.5}
              />
              <p
                className="text-sm text-[#1C3A2A]/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Arraste imagens ou clique para selecionar
              </p>
              <p
                className="text-xs text-[#1C3A2A]/30"
                style={{ fontFamily: "var(--font-body)" }}
              >
                JPEG, PNG, WebP · máx 10 MB · múltiplas imagens permitidas · crop antes do envio
              </p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files);
            }
            e.target.value = "";
          }}
        />

        {/* Queue indicator */}
        {fileQueue.length > 0 && (
          <div className="mb-8 px-4 py-3 bg-[#B8963E]/5 border border-[#B8963E]/20 flex items-center gap-3">
            <Loader2
              className="w-4 h-4 text-[#B8963E] animate-spin shrink-0"
              strokeWidth={1.5}
            />
            <p
              className="text-sm text-[#1C3A2A]/60"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {fileQueue.length === 1
                ? "1 imagem aguardando na fila"
                : `${fileQueue.length} imagens aguardando na fila`}
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#1C3A2A]/30 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className={`text-center py-20 ${fileQueue.length > 0 ? "" : ""}`}>
            <p
              className="text-[#1C3A2A]/30 text-lg"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Nenhuma imagem nesta pasta
            </p>
            <p
              className="text-[#1C3A2A]/20 text-sm mt-1"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Use a área acima para fazer upload
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, i) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="group relative bg-white border border-[#1C3A2A]/10 overflow-hidden"
              >
                <div className="relative aspect-square">
                  <Image src={file.url} alt={file.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-[#1C3A2A]/0 group-hover:bg-[#1C3A2A]/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => copyUrl(file.url)}
                      title="Copiar URL"
                      className="p-2 bg-white text-[#1C3A2A] hover:bg-[#FAF7F2] transition-colors"
                    >
                      {copied === file.url ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(file.path)}
                      title="Remover"
                      className="p-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-[#1C3A2A]/5">
                  <p
                    className="text-[10px] text-[#1C3A2A]/50 truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {file.name}
                  </p>
                  <p
                    className="text-[9px] text-[#1C3A2A]/30"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {file.size > 0 ? `${(file.size / 1024).toFixed(0)} KB` : "—"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {rawSrc && (
        <CropModal
          key={rawSrc.slice(0, 80)}  /* force remount on new image so crop/zoom resets */
          imageSrc={rawSrc}
          aspect={4 / 3}
          label={pendingName}
          progress={progress}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
          onSkipFile={queueTotal > 1 ? handleSkipFile : undefined}
        />
      )}

      <ToastWrapper toast={toast} clearToast={() => setToast(null)} />
    </>
  );
}
