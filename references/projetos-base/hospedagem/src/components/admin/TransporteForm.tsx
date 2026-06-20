"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Copy } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "./ImageUploader";
import { ToastWrapper } from "./Toast";

const schema = z.object({
  titulo: z.string().min(2, "Título obrigatório"),
  descricao: z.string().optional(),
  tipo: z.enum(["transfer", "carro", "van", "passeio"]).default("transfer"),
  capacidade: z.string().optional(),
  preco: z.string().optional(),
  duracaoEstimada: z.string().optional(),
  origem: z.string().optional(),
  destino: z.string().optional(),
  whatsappLink: z.string().optional(),
  disponivel: z.boolean().default(true),
});

export type TransporteFormData = z.infer<typeof schema>;

const inputClass =
  "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass =
  "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

export interface InitialTransporteData extends Partial<TransporteFormData> {
  id?: number;
  imagemUrl?: string | null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function TransporteForm({ initialData }: { initialData?: InitialTransporteData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [imagemUrl, setImagemUrl] = useState<string | undefined>(
    initialData?.imagemUrl ?? undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransporteFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { tipo: "transfer", disponivel: true, ...initialData },
  });

  const isEdit = !!initialData?.id;

  async function handleDuplicate() {
    if (!initialData?.id) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/admin/transporte/${initialData.id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao duplicar");
      setToast({ message: "Opção de transporte duplicada!", type: "success" });
      setTimeout(() => router.push(`/admin/transporte/${json.id}`), 800);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erro ao duplicar", type: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  const onSubmit = async (data: TransporteFormData) => {
    setLoading(true);
    setError("");
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/admin/transporte/${initialData.id}` : "/api/admin/transporte";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imagemUrl,
          capacidade: data.capacidade ? Number(data.capacidade) : undefined,
          preco: data.preco ? Number(data.preco) : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setToast({ message: "Transporte salvo!", type: "success" });
      setTimeout(() => { router.push("/admin/transporte"); router.refresh(); }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar transporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {isEdit && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pb-2"
          >
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="flex items-center gap-2 px-4 py-2 border border-[#1C3A2A]/20 text-xs text-[#1C3A2A]/60 tracking-widest uppercase hover:border-[#C4623A] hover:text-[#C4623A] transition-colors disabled:opacity-40"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {duplicating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Duplicar
            </button>
          </motion.div>
        )}

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {error}
          </div>
        )}

        <motion.div
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-[#1C3A2A]/10 p-8"
        >
          <h2
            className="text-[#1C3A2A] text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            Dados da opção
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Título *
              </label>
              <input
                {...register("titulo")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
              {errors.titulo && (
                <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Tipo
              </label>
              <select
                {...register("tipo")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="transfer">Transfer</option>
                <option value="carro">Carro</option>
                <option value="van">Van</option>
                <option value="passeio">Passeio</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                {...register("disponivel")}
                id="transporte-disponivel"
                className="w-4 h-4 accent-[#C4623A]"
              />
              <label
                htmlFor="transporte-disponivel"
                className="text-sm text-[#1C3A2A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Disponível no site
              </label>
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Capacidade (pessoas)
              </label>
              <input
                {...register("capacidade")}
                type="number"
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Preço (R$)
              </label>
              <input
                {...register("preco")}
                type="number"
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Duração estimada
              </label>
              <input
                {...register("duracaoEstimada")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="Ex: 20 min"
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Link WhatsApp
              </label>
              <input
                {...register("whatsappLink")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Origem
              </label>
              <input
                {...register("origem")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Destino
              </label>
              <input
                {...register("destino")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Descrição
              </label>
              <textarea
                {...register("descricao")}
                rows={5}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-[#1C3A2A]/10 p-8"
        >
          <h2
            className="text-[#1C3A2A] text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            Imagem — proporção 16:9
          </h2>
          <ImageUploader
            aspect={16 / 9}
            value={imagemUrl}
            onChange={setImagemUrl}
            folder="transporte"
            hint="Foto do veículo ou trajeto. Recortada automaticamente em 16:9."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-4"
        >
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar transporte
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 border border-[#1C3A2A]/20 text-[#1C3A2A]/60 text-sm tracking-widest uppercase hover:border-[#1C3A2A]/40 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Cancelar
          </button>
        </motion.div>
      </form>

      <ToastWrapper toast={toast} clearToast={() => setToast(null)} />
    </>
  );
}
