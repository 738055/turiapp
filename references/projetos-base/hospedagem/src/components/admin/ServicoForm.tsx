"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Copy } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "./ImageUploader";
import MultiImageUploader from "./MultiImageUploader";
import IconPicker from "./IconPicker";
import { ToastWrapper } from "./Toast";

const schema = z.object({
  titulo: z.string().min(2, "Título obrigatório"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  descricao: z.string().optional(),
  categoria: z.enum(["lazer", "alimentacao", "transporte", "experiencia", "ambiente"]).default("lazer"),
  preco: z.string().optional(),
  unidade: z.string().optional(),
  disponivel: z.boolean().default(true),
  seoTitulo: z.string().optional(),
  seoDescricao: z.string().optional(),
});

export type ServicoFormData = z.infer<typeof schema>;

const inputClass =
  "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass =
  "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface InitialServicoData extends Partial<ServicoFormData> {
  id?: number;
  imagemUrl?: string | null;
  imagens?: string[] | null;
  icone?: string | null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function ServicoForm({ initialData }: { initialData?: InitialServicoData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [imagemUrl, setImagemUrl] = useState<string | undefined>(
    initialData?.imagemUrl ?? undefined
  );
  const [imagens, setImagens] = useState<string[]>(initialData?.imagens ?? []);
  const [icone, setIcone] = useState<string>(initialData?.icone ?? "Star");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ServicoFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { categoria: "lazer", disponivel: true, ...initialData },
  });

  const isEdit = !!initialData?.id;

  const autoSlug = () => {
    const titulo = getValues("titulo");
    if (titulo) setValue("slug", slugify(titulo));
  };

  async function handleDuplicate() {
    if (!initialData?.id) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/admin/servicos/${initialData.id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao duplicar");
      setToast({ message: "Serviço duplicado!", type: "success" });
      setTimeout(() => router.push(`/admin/servicos/${json.id}`), 800);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erro ao duplicar", type: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  const onSubmit = async (data: ServicoFormData) => {
    setLoading(true);
    setError("");
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/admin/servicos/${initialData.id}` : "/api/admin/servicos";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          preco: data.preco ? Number(data.preco) : undefined,
          imagemUrl,
          imagens,
          icone,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setToast({ message: "Serviço salvo!", type: "success" });
      setTimeout(() => { router.push("/admin/servicos"); router.refresh(); }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar serviço");
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

        {/* Informações */}
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
            Informações do serviço
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Título *
              </label>
              <input
                {...register("titulo")}
                onBlur={autoSlug}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              />
              {errors.titulo && (
                <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Slug *
              </label>
              <div className="flex gap-2">
                <input
                  {...register("slug")}
                  className={inputClass}
                  style={{ fontFamily: "var(--font-body)" }}
                />
                <button
                  type="button"
                  onClick={autoSlug}
                  className="px-4 border border-[#1C3A2A]/20 text-[#1C3A2A]/60 text-xs hover:border-[#C4623A] hover:text-[#C4623A] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Auto
                </button>
              </div>
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Categoria
              </label>
              <select
                {...register("categoria")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="lazer">Lazer</option>
                <option value="alimentacao">Alimentação</option>
                <option value="transporte">Transporte</option>
                <option value="experiencia">Experiência</option>
                <option value="ambiente">Ambiente</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                {...register("disponivel")}
                id="disponivel"
                className="w-4 h-4 accent-[#C4623A]"
              />
              <label
                htmlFor="disponivel"
                className="text-sm text-[#1C3A2A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Disponível no site
              </label>
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
                Unidade
              </label>
              <input
                {...register("unidade")}
                className={inputClass}
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="por pessoa, por diária..."
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

        {/* Imagens */}
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
            Imagem & Ícone
          </h2>
          <div className="space-y-6">
            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Imagem principal — proporção 4:5 (card vertical)
              </label>
              <div className="max-w-[240px]">
                <ImageUploader
                  aspect={4 / 5}
                  value={imagemUrl}
                  onChange={setImagemUrl}
                  folder="servicos"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Galeria adicional
              </label>
              <MultiImageUploader
                value={imagens}
                onChange={setImagens}
                aspect={4 / 3}
                folder="servicos"
                maxImages={8}
              />
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                Ícone representativo
              </label>
              <button
                type="button"
                onClick={() => setShowIconPicker((o) => !o)}
                className="flex items-center gap-3 px-4 py-3 border border-[#1C3A2A]/20 hover:border-[#C4623A] transition-colors text-sm text-[#1C3A2A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="text-xs text-[#1C3A2A]/50 uppercase tracking-wider">{icone}</span>
                <span className="text-[10px] text-[#1C3A2A]/30">
                  {showIconPicker ? "Fechar" : "Trocar ícone"}
                </span>
              </button>
              {showIconPicker && (
                <div className="mt-2">
                  <IconPicker value={icone} onChange={(v) => { setIcone(v); setShowIconPicker(false); }} />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* SEO */}
        <motion.div
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-[#1C3A2A]/10 p-8"
        >
          <h2
            className="text-[#1C3A2A] text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
          >
            SEO
          </h2>
          <div className="space-y-4">
            <input
              {...register("seoTitulo")}
              className={inputClass}
              style={{ fontFamily: "var(--font-body)" }}
              placeholder="Título SEO"
            />
            <textarea
              {...register("seoDescricao")}
              rows={3}
              className={inputClass}
              style={{ fontFamily: "var(--font-body)" }}
              placeholder="Descrição SEO"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
                <Save className="w-4 h-4" /> Salvar serviço
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
