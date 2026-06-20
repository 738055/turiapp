import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import TransporteForm, { type TransporteFormData, type InitialTransporteData } from "@/components/admin/TransporteForm";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { TransporteOpcao } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

function toFormData(item: TransporteOpcao): InitialTransporteData {
  return {
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao || "",
    tipo: (item.tipo as TransporteFormData["tipo"]) || "transfer",
    capacidade: item.capacidade?.toString() || "",
    preco: item.preco?.toString() || "",
    duracaoEstimada: item.duracao_estimada || "",
    origem: item.origem || "",
    destino: item.destino || "",
    imagemUrl: item.imagem_url || undefined,
    whatsappLink: item.whatsapp_link || "",
    disponivel: item.disponivel !== false,
  };
}

export default async function EditarTransportePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin");

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transporte_opcoes")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) notFound();

  return (
    <div>
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>
          Transporte
        </p>
        <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Editar opção
        </h1>
      </div>
      <TransporteForm initialData={toFormData(data as TransporteOpcao)} />
    </div>
  );
}
