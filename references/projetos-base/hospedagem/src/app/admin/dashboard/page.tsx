import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Home, Wrench, Car, Megaphone, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import Card from "@/components/admin/Card";

async function getStats() {
  try {
    const supabase = createSupabaseServerClient();
    const [hospCount, servCount, transCount, scriptCount] = await Promise.all([
      supabase.from("hospedagens").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("servicos").select("id", { count: "exact", head: true }).eq("disponivel", true),
      supabase.from("transporte_opcoes").select("id", { count: "exact", head: true }).eq("disponivel", true),
      supabase.from("scripts_marketing").select("id", { count: "exact", head: true }).eq("ativo", true),
    ]);

    return {
      hospedagens: hospCount.count || 0,
      servicos: servCount.count || 0,
      transporte: transCount.count || 0,
      scripts: scriptCount.count || 0,
    };
  } catch {
    return { hospedagens: 0, servicos: 0, transporte: 0, scripts: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin");

  const stats = await getStats();

  const cards = [
    { label: "Hospedagens ativas", value: stats.hospedagens, icon: Home, href: "/admin/hospedagens", color: "#1C3A2A" },
    { label: "Serviços disponíveis", value: stats.servicos, icon: Wrench, href: "/admin/servicos", color: "#C4623A" },
    { label: "Opções de transporte", value: stats.transporte, icon: Car, href: "/admin/transporte", color: "#B8963E" },
    { label: "Scripts ativos", value: stats.scripts, icon: Megaphone, href: "/admin/marketing", color: "#1C3A2A" },
  ];

  const quickActions = [
    { label: "Nova hospedagem", href: "/admin/hospedagens/novo", icon: Home },
    { label: "Novo serviço", href: "/admin/servicos/novo", icon: Wrench },
    { label: "Upload de mídia", href: "/admin/midia", icon: Eye },
    { label: "Editar SEO", href: "/admin/seo", icon: TrendingUp },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#C4623A] text-[11px] tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: "var(--font-body)" }}>
          Bem-vindo
        </p>
        <h1 className="text-[#1C3A2A] text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map(({ label, value, icon: Icon, href, color }, i) => (
          <Card key={href} delay={i * 0.07} hover>
            <Link href={href} className="block p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.5} />
                </div>
              </div>
              <p
                className="text-[#1C3A2A] text-3xl mb-1"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
              >
                {value}
              </p>
              <p
                className="text-[#1C3A2A]/50 text-xs"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {label}
              </p>
            </Link>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-[#1C3A2A]/10 p-8 mb-8">
        <h2 className="text-[#1C3A2A] text-xl mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 border border-[#1C3A2A]/10 px-4 py-3 text-sm hover:border-[#C4623A]/40 hover:text-[#C4623A] transition-colors text-[#1C3A2A]/70"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Site preview */}
      <div className="bg-[#1C3A2A] p-8 flex items-center justify-between">
        <div>
          <p className="text-[#FAF7F2] text-xl mb-1"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
            Visualizar site público
          </p>
          <p className="text-[#FAF7F2]/50 text-sm" style={{ fontFamily: "var(--font-body)" }}>
            mimosaflor.com.br
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Eye className="w-3.5 h-3.5" /> Abrir site
        </Link>
      </div>
    </div>
  );
}
