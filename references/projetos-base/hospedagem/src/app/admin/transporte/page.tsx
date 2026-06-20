import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { TransporteOpcao } from "@/lib/db/schema";
import Link from "next/link";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import DuplicateButton from "@/components/admin/DuplicateButton";
import { formatCurrency } from "@/lib/utils";

async function getTransporte() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transporte_opcoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as TransporteOpcao[]) || [];
  } catch {
    return [] as TransporteOpcao[];
  }
}

export default async function TransporteAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin");
  const items = await getTransporte();

  const tipoLabel: Record<string, string> = { transfer: "Transfer", carro: "Carro", van: "Van", passeio: "Passeio" };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>Gerenciar</p>
          <h1 className="text-[#1C3A2A] text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Transporte</h1>
        </div>
        <Link href="/admin/transporte/novo"
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Plus className="w-4 h-4" /> Nova opção
        </Link>
      </div>

      <div className="bg-white border border-[#1C3A2A]/10 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#1C3A2A]/40 text-lg mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Nenhuma opção cadastrada</p>
            <Link href="/admin/transporte/novo" className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
              <Plus className="w-4 h-4" /> Criar primeira opção
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C3A2A]/10">
                {["Título", "Tipo", "Capacidade", "Preço", "Ativo", "Ações"].map((h) => (
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
                      {tipoLabel[item.tipo || "transfer"]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1C3A2A]" style={{ fontFamily: "var(--font-body)" }}>
                    {item.capacidade ? `${item.capacidade} pessoas` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1C3A2A]" style={{ fontFamily: "var(--font-body)" }}>
                    {item.preco ? formatCurrency(item.preco) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {item.disponivel ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-[#1C3A2A]/20" />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/transporte/${item.id}`}
                        className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#C4623A] hover:text-[#C4623A] transition-colors text-[#1C3A2A]/50">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <DuplicateButton entity="transporte" id={item.id} />
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
