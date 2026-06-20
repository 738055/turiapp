import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ServicoForm, { type ServicoFormData, type InitialServicoData } from "@/components/admin/ServicoForm";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Servico } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

function toFormData(item: Servico): InitialServicoData {
  return {
    id: item.id,
    titulo: item.titulo,
    slug: item.slug,
    descricao: item.descricao || "",
    categoria: (item.categoria as ServicoFormData["categoria"]) || "lazer",
    preco: item.preco?.toString() || "",
    unidade: item.unidade || "",
    imagemUrl: item.imagem_url || undefined,
    imagens: item.imagens ?? [],
    icone: item.icone || "Star",
    disponivel: item.disponivel !== false,
    seoTitulo: item.seo_titulo || "",
    seoDescricao: item.seo_descricao || "",
  };
}

export default async function EditarServicoPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin");

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) notFound();

  return (
    <div>
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>
          Serviços
        </p>
        <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Editar serviço
        </h1>
      </div>
      <ServicoForm initialData={toFormData(data as Servico)} />
    </div>
  );
}
