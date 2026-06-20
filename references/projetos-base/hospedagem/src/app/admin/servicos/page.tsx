import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Servico } from "@/lib/db/schema";
import Link from "next/link";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import DuplicateButton from "@/components/admin/DuplicateButton";
import { formatCurrency } from "@/lib/utils";

async function getServicos() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as Servico[]) || [];
  } catch {
    return [] as Servico[];
  }
}

const catLabel: Record<string, string> = {
  lazer: "Lazer",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  experiencia: "Experiência",
  ambiente: "Ambiente",
};

export default async function ServicosAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin");
  const items = await getServicos();

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Gerenciar</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Serviços</h1>
        </div>
        <Link href="/admin/servicos/novo"
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Plus className="w-4 h-4" /> Novo serviço
        </Link>
      </div>
      <div className="bg-white border border-[#1C3A2A]/10 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#1C3A2A]/40 text-lg mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Nenhum serviço cadastrado</p>
            <Link href="/admin/servicos/novo" className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
              <Plus className="w-4 h-4" /> Criar primeiro serviço
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C3A2A]/10">
                {["Serviço", "Categoria", "Preço", "Ativo", "Ações"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40" style={{ fontFamily: "var(--font-body)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#1C3A2A]/5 hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[#1C3A2A] text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>{item.titulo}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] tracking-wider uppercase text-[#C4623A] border border-[#C4623A]/30 px-2 py-1" style={{ fontFamily: "var(--font-body)" }}>
                      {catLabel[item.categoria || "lazer"]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1C3A2A]" style={{ fontFamily: "var(--font-body)" }}>
                    {item.preco ? `${formatCurrency(item.preco)} / ${item.unidade}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {item.disponivel ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-[#1C3A2A]/20" />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/servicos/${item.id}`}
                        className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#C4623A] hover:text-[#C4623A] transition-colors text-[#1C3A2A]/50">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <DuplicateButton entity="servicos" id={item.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
