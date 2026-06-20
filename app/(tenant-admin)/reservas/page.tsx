import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CalendarCheck, ChevronRight, Download } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" }> = {
  pending:   { label: "Pendente",   variant: "secondary" },
  confirmed: { label: "Confirmada", variant: "success" },
  cancelled: { label: "Cancelada",  variant: "destructive" },
  completed: { label: "Concluída",  variant: "default" },
  refunded:  { label: "Reembolsada", variant: "secondary" },
};

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  let query = supabase
    .from("bookings")
    .select("id, status, total_price, currency, check_in, check_out, guests, customer_name, customer_email, created_at, products(title)")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.q) query = query.ilike("customer_name", `%${sp.q}%`);

  const { data: bookings } = await query;

  const statusFilters = ["", "pending", "confirmed", "completed", "cancelled", "refunded"];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie todas as reservas dos seus produtos</p>
        </div>
        <a
          href={`/api/bookings/export${sp.status ? `?status=${sp.status}` : ""}`}
          download
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <Link
            key={s}
            href={s ? `/reservas?status=${s}` : "/reservas"}
            className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
              sp.status === s || (!s && !sp.status)
                ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s ? STATUS_LABELS[s]?.label : "Todas"}
          </Link>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {bookings?.map((b) => {
          const product = b.products as unknown as { title: string } | null;
          const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, variant: "secondary" as const };
          return (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{b.customer_name}</p>
                    <p className="text-xs text-gray-400">
                      {product?.title}
                      {b.check_in && (
                        <> · {new Date(b.check_in).toLocaleDateString("pt-BR")}</>
                      )}
                      {b.guests > 1 && <> · {b.guests} pessoas</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm">
                    {formatCurrency(b.total_price, b.currency)}
                  </p>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reservas/${b.id}`}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!bookings?.length && (
        <div className="text-center py-16 text-gray-400">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Nenhuma reserva encontrada</p>
          <p className="text-sm mt-1">
            {sp.status ? "Tente remover o filtro de status." : "As reservas aparecerão aqui."}
          </p>
        </div>
      )}
    </div>
  );
}
