import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { AffiliateJoin } from "@/components/affiliates/AffiliateJoin";
import { AffiliateLink } from "@/components/affiliates/AffiliateLink";

export const dynamic = "force-dynamic";

export default async function AfiliadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: affiliate } = await service
    .from("affiliates")
    .select("id, code, commission_percent")
    .eq("user_id", user.id)
    .maybeSingle();

  const platformHost = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";

  if (!affiliate) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Programa de afiliados</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          Indique o TuriApp e ganhe comissão recorrente por cada cliente que assinar pelo seu link.
        </p>
        <AffiliateJoin />
      </Shell>
    );
  }

  const { data: referrals } = await service
    .from("affiliate_referrals")
    .select("status, commission_amount, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false });

  const rows = referrals ?? [];
  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    converted: rows.filter((r) => r.status === "converted").length,
    paid: rows.filter((r) => r.status === "paid").length,
  };
  const earnedPending = rows.filter((r) => r.status === "converted").reduce((s, r) => s + Number(r.commission_amount), 0);
  const earnedPaid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.commission_amount), 0);

  const link = `https://${platformHost}/?ref=${affiliate.code}`;

  const cards = [
    { label: "Indicações", value: rows.length },
    { label: "Clientes pagantes", value: counts.converted + counts.paid },
    { label: "A receber", value: formatCurrency(earnedPending, "BRL") },
    { label: "Já pago", value: formatCurrency(earnedPaid, "BRL") },
  ];

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Programa de afiliados</h1>
      <p className="text-gray-500 text-sm mt-1 mb-6">Comissão de {affiliate.commission_percent}% por cliente que assinar.</p>

      <AffiliateLink link={link} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-medium text-gray-700">Suas indicações</div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma indicação ainda. Compartilhe seu link!</p>
        ) : (
          <div className="divide-y">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <span className="font-medium">{formatCurrency(Number(r.commission_amount), "BRL")}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Em teste", cls: "bg-gray-100 text-gray-600" },
    converted: { label: "Pagante", cls: "bg-green-100 text-green-700" },
    paid: { label: "Comissão paga", cls: "bg-sky-100 text-sky-700" },
    cancelled: { label: "Cancelada", cls: "bg-red-100 text-red-600" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </main>
  );
}
