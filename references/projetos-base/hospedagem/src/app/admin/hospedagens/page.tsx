import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Hospedagem } from "@/lib/db/schema";
import Link from "next/link";
import { Plus, Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import DuplicateButton from "@/components/admin/DuplicateButton";
import { formatCurrency } from "@/lib/utils";

async function getHospedagens() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("hospedagens")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as Hospedagem[]) || [];
  } catch {
    return [] as Hospedagem[];
  }
}

const statusColors: Record<string, string> = {
  ativo: "text-emerald-600 bg-emerald-50",
  inativo: "text-gray-500 bg-gray-100",
  manutencao: "text-amber-600 bg-amber-50",
};

const statusLabel: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  manutencao: "Manutenção",
};

export default async function HospedagensAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin");

  const items = await getHospedagens();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1"
            style={{ fontFamily: "var(--font-body)" }}>
            Gerenciar
          </p>
          <h1 className="text-[#1C3A2A] text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Hospedagens
          </h1>
        </div>
        <Link
          href="/admin/hospedagens/novo"
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-4 h-4" /> Nova hospedagem
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#1C3A2A]/10 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#1C3A2A]/40 text-lg mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              Nenhuma hospedagem cadastrada
            </p>
            <Link
              href="/admin/hospedagens/novo"
              className="inline-flex items-center gap-2 bg-[#1C3A2A] text-[#FAF7F2] px-6 py-3 text-xs tracking-widest uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Plus className="w-4 h-4" /> Criar primeira hospedagem
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C3A2A]/10">
                {["Hospedagem", "Status", "Destaque", "Preço/noite", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-[10px] tracking-[0.2em] uppercase text-[#1C3A2A]/40"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#1C3A2A]/5 hover:bg-[#FAF7F2] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-[#1C3A2A] text-sm font-medium"
                      style={{ fontFamily: "var(--font-body)" }}>
                      {item.titulo}
                    </p>
                    <p className="text-[#1C3A2A]/40 text-xs mt-0.5"
                      style={{ fontFamily: "var(--font-body)" }}>
                      /{item.slug}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-[10px] tracking-wider uppercase px-2.5 py-1 font-medium ${statusColors[item.status || "inativo"]}`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {statusLabel[item.status || "inativo"]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.destaque ? (
                      <ToggleRight className="w-5 h-5 text-[#B8963E]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[#1C3A2A]/20" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1C3A2A]"
                    style={{ fontFamily: "var(--font-body)" }}>
                    {item.preco_base ? formatCurrency(item.preco_base) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/hospedagens/${item.id}`}
                        className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#C4623A] hover:text-[#C4623A] transition-colors text-[#1C3A2A]/50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <DuplicateButton entity="hospedagens" id={item.id} />
                      <Link
                        href={`/hospedagem/${item.slug}`}
                        target="_blank"
                        className="w-8 h-8 border border-[#1C3A2A]/20 flex items-center justify-center hover:border-[#1C3A2A] hover:text-[#1C3A2A] transition-colors text-[#1C3A2A]/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
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
