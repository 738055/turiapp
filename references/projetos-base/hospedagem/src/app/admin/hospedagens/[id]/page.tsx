import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import HospedagemForm, { type HospedagemFormData } from "@/components/admin/HospedagemForm";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Hospedagem } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

function toFormData(item: Hospedagem): Partial<HospedagemFormData> & { id: number; regras?: string[] | null } {
  return {
    id: item.id,
    titulo: item.titulo,
    slug: item.slug,
    descricaoCurta: item.descricao_curta || "",
    descricaoLonga: item.descricao_longa || "",
    capacidadeMax: item.capacidade_max?.toString() || "",
    quartos: item.quartos?.toString() || "",
    banheiros: item.banheiros?.toString() || "",
    precoBase: item.preco_base?.toString() || "",
    status: (item.status as HospedagemFormData["status"]) || "ativo",
    destaque: Boolean(item.destaque),
    checkIn: item.check_in || "",
    checkOut: item.check_out || "",
    latitude: item.latitude?.toString() || "",
    longitude: item.longitude?.toString() || "",
    seoTitulo: item.seo_titulo || "",
    seoDescricao: item.seo_descricao || "",
    regras: item.regras || [],
  };
}

export default async function EditarHospedagemPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin");

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospedagens")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) notFound();

  const item = data as Hospedagem;

  return (
    <div>
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>
          Hospedagens
        </p>
        <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Editar hospedagem
        </h1>
      </div>
      <HospedagemForm initialData={toFormData(item)} />
    </div>
  );
}
