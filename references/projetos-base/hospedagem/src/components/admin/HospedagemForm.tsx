"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Save, Copy, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import MultiImageUploader from "./MultiImageUploader";
import ImageUploader from "./ImageUploader";
import AmenidadesEditor, { type Amenidade } from "./AmenidadesEditor";
import { ToastWrapper } from "./Toast";

const schema = z.object({
  titulo: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  descricaoCurta: z.string().optional(),
  descricaoLonga: z.string().optional(),
  capacidadeMax: z.string().optional(),
  quartos: z.string().optional(),
  banheiros: z.string().optional(),
  precoBase: z.string().optional(),
  status: z.enum(["ativo", "inativo", "manutencao"]).default("ativo"),
  destaque: z.boolean().default(false),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  seoTitulo: z.string().optional(),
  seoDescricao: z.string().optional(),
});

export type HospedagemFormData = z.infer<typeof schema>;

const inputClass =
  "w-full border border-[#1C3A2A]/20 px-4 py-3 text-sm text-[#1C3A2A] bg-white focus:outline-none focus:border-[#C4623A] transition-colors";
const labelClass =
  "block text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40 mb-2";

interface InitialData extends Partial<HospedagemFormData> {
  id?: number;
  regras?: string[] | null;
  imagens?: string[] | null;
  amenidades?: Amenidade[] | null;
  seoOgImage?: string | null;
  slug?: string;
  status?: "ativo" | "inativo" | "manutencao";
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function HospedagemForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [regras, setRegras] = useState<string[]>(initialData?.regras ?? []);
  const [novaRegra, setNovaRegra] = useState("");
  const [imagens, setImagens] = useState<string[]>(initialData?.imagens ?? []);
  const [amenidades, setAmenidades] = useState<Amenidade[]>(initialData?.amenidades ?? []);
  const [seoOgImage, setSeoOgImage] = useState<string | undefined>(
    initialData?.seoOgImage ?? undefined
  );

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HospedagemFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { status: "ativo", destaque: false, ...initialData },
  });

  const statusWatch = watch("status");
  const slugWatch = watch("slug");
  const isEdit = !!initialData?.id;

  const autoSlug = () => {
    const titulo = getValues("titulo");
    if (!titulo) return;
    const slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setValue("slug", slug);
  };

  const addRegra = () => {
    if (novaRegra.trim()) {
      setRegras([...regras, novaRegra.trim()]);
      setNovaRegra("");
    }
  };

  async function handleDuplicate() {
    if (!initialData?.id) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/admin/hospedagens/${initialData.id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao duplicar");
      setToast({ message: "Hospedagem duplicada!", type: "success" });
      setTimeout(() => router.push(`/admin/hospedagens/${json.id}`), 800);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erro ao duplicar", type: "error" });
    } finally {
      setDuplicating(false);
    }
  }

  const onSubmit = async (rawData: unknown) => {
    const data = rawData as HospedagemFormData;
    setLoading(true);
    setError("");
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `/api/admin/hospedagens/${initialData.id}`
        : "/api/admin/hospedagens";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          regras,
          imagens,
          amenidades,
          seoOgImage,
          capacidadeMax: data.capacidadeMax ? Number(data.capacidadeMax) : undefined,
          quartos: data.quartos ? Number(data.quartos) : undefined,
          banheiros: data.banheiros ? Number(data.banheiros) : undefined,
          precoBase: data.precoBase ? Number(data.precoBase) : undefined,
          latitude: data.latitude ? Number(data.latitude) : undefined,
          longitude: data.longitude ? Number(data.longitude) : undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setToast({ message: "Hospedagem salva com sucesso!", type: "success" });
      setTimeout(() => { router.push("/admin/hospedagens"); router.refresh(); }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    "Informações básicas",
    "Imagens",
    "Capacidade & Preço",
    "Comodidades",
    "Regras da casa",
    "Localização",
    "SEO",
  ];

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Action bar (edit mode only) */}
        {isEdit && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pb-2"
          >
            {statusWatch === "ativo" && slugWatch && (
              <a
                href={`/hospedagem/${slugWatch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-[#1C3A2A]/20 text-xs text-[#1C3A2A]/60 tracking-widest uppercase hover:border-[#1C3A2A]/40 transition-colors"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver no site
              </a>
            )}
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

        {sections.map((title, i) => (
          <motion.div
            key={title}
            custom={i}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white border border-[#1C3A2A]/10 p-8"
          >
            <h2
              className="text-[#1C3A2A] text-xl mb-6"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              {title}
            </h2>

            {/* ── Informações básicas ── */}
            {title === "Informações básicas" && (
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
                    placeholder="Ex: Casa Principal"
                  />
                  {errors.titulo && (
                    <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Slug (URL) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register("slug")}
                      className={inputClass}
                      style={{ fontFamily: "var(--font-body)" }}
                      placeholder="casa-principal"
                    />
                    <button
                      type="button"
                      onClick={autoSlug}
                      className="px-4 border border-[#1C3A2A]/20 text-[#1C3A2A]/60 text-xs hover:border-[#C4623A] hover:text-[#C4623A] transition-colors whitespace-nowrap"
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
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    {...register("destaque")}
                    id="destaque"
                    className="w-4 h-4 accent-[#C4623A]"
                  />
                  <label
                    htmlFor="destaque"
                    className="text-sm text-[#1C3A2A]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Destacar na página inicial
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Descrição curta
                  </label>
                  <textarea
                    {...register("descricaoCurta")}
                    rows={2}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="Breve descrição para cards e listagens"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Descrição completa
                  </label>
                  <textarea
                    {...register("descricaoLonga")}
                    rows={6}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="Descrição detalhada da hospedagem..."
                  />
                </div>
              </div>
            )}

            {/* ── Imagens ── */}
            {title === "Imagens" && (
              <div className="space-y-6">
                <div>
                  <p
                    className="text-xs text-[#1C3A2A]/50 mb-4"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    A primeira imagem é a capa e hero da página pública. Arraste para reordenar.
                    Proporção 4:3 (galeria) — recortada automaticamente.
                  </p>
                  <MultiImageUploader
                    value={imagens}
                    onChange={setImagens}
                    aspect={4 / 3}
                    folder="hospedagens"
                  />
                </div>

                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Imagem OG (redes sociais) — proporção 1.91:1
                  </label>
                  <ImageUploader
                    aspect={1.91}
                    value={seoOgImage}
                    onChange={(v) => setSeoOgImage(v)}
                    folder="hospedagens/og"
                    hint="Usada ao compartilhar no WhatsApp, Facebook e Twitter/X. Ideal: 1200×628 px."
                  />
                </div>
              </div>
            )}

            {/* ── Capacidade & Preço ── */}
            {title === "Capacidade & Preço" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {(
                  [
                    { label: "Hóspedes máx.", name: "capacidadeMax", placeholder: "10" },
                    { label: "Quartos", name: "quartos", placeholder: "4" },
                    { label: "Banheiros", name: "banheiros", placeholder: "3" },
                    { label: "Preço base (R$)", name: "precoBase", placeholder: "890" },
                  ] as const
                ).map(({ label, name, placeholder }) => (
                  <div key={name}>
                    <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                      {label}
                    </label>
                    <input
                      {...register(name)}
                      type="number"
                      className={inputClass}
                      style={{ fontFamily: "var(--font-body)" }}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Check-in
                  </label>
                  <input
                    {...register("checkIn")}
                    type="time"
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Check-out
                  </label>
                  <input
                    {...register("checkOut")}
                    type="time"
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>
              </div>
            )}

            {/* ── Comodidades ── */}
            {title === "Comodidades" && (
              <AmenidadesEditor value={amenidades} onChange={setAmenidades} />
            )}

            {/* ── Regras ── */}
            {title === "Regras da casa" && (
              <>
                <div className="flex gap-2 mb-4">
                  <input
                    value={novaRegra}
                    onChange={(e) => setNovaRegra(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRegra())}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="Ex: Não é permitido fumar nas dependências"
                  />
                  <button
                    type="button"
                    onClick={addRegra}
                    className="px-4 bg-[#1C3A2A] text-[#FAF7F2] hover:bg-[#2a5540] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {regras.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-[#1C3A2A]/70"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <span className="text-[#C4623A]">—</span>
                      <span className="flex-1">{r}</span>
                      <button
                        type="button"
                        onClick={() => setRegras(regras.filter((_, j) => j !== i))}
                        className="text-[#1C3A2A]/30 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* ── Localização ── */}
            {title === "Localização" && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Latitude
                  </label>
                  <input
                    {...register("latitude")}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="-25.571917"
                  />
                  <p
                    className="text-[10px] text-[#1C3A2A]/30 mt-1"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ex: -25.571917 (Foz do Iguaçu)
                  </p>
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Longitude
                  </label>
                  <input
                    {...register("longitude")}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="-54.516338"
                  />
                  <p
                    className="text-[10px] text-[#1C3A2A]/30 mt-1"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ex: -54.516338 (Foz do Iguaçu)
                  </p>
                </div>
              </div>
            )}

            {/* ── SEO ── */}
            {title === "SEO" && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Título SEO
                  </label>
                  <input
                    {...register("seoTitulo")}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="Título para mecanismos de busca"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontFamily: "var(--font-body)" }}>
                    Descrição SEO
                  </label>
                  <textarea
                    {...register("seoDescricao")}
                    rows={3}
                    className={inputClass}
                    style={{ fontFamily: "var(--font-body)" }}
                    placeholder="Meta description (máx. 160 caracteres)"
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden inline-flex items-center gap-2 bg-[#C4623A] text-white px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors disabled:opacity-60"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar hospedagem
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
