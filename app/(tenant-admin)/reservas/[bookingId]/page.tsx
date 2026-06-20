import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BookingActions } from "@/components/admin/BookingActions";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Concluída",
  refunded: "Reembolsada",
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, products(title, type, module)")
    .eq("id", bookingId)
    .eq("tenant_id", membership!.tenant_id)
    .single();

  if (!booking) notFound();

  const product = booking.products as unknown as { title: string; type: string; module: string } | null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reserva #{bookingId.slice(0, 8).toUpperCase()}</h1>
          <p className="text-gray-500 text-sm mt-1">{product?.title}</p>
        </div>
        <Badge
          variant={
            booking.status === "confirmed" ? "success"
            : booking.status === "cancelled" ? "destructive"
            : "secondary"
          }
          className="text-sm px-3 py-1"
        >
          {STATUS_LABELS[booking.status] ?? booking.status}
        </Badge>
      </div>

      {/* Customer info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nome" value={booking.customer_name} />
          <Row label="E-mail" value={booking.customer_email} />
          {booking.customer_phone && <Row label="Telefone" value={booking.customer_phone} />}
        </CardContent>
      </Card>

      {/* Booking details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalhes da reserva</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {booking.check_in && (
            <Row label="Check-in" value={new Date(booking.check_in).toLocaleDateString("pt-BR")} />
          )}
          {booking.check_out && (
            <Row label="Check-out" value={new Date(booking.check_out).toLocaleDateString("pt-BR")} />
          )}
          <Row label="Pessoas" value={String(booking.guests)} />
          <Row label="Total" value={formatCurrency(booking.total_price, booking.currency)} bold />
          {booking.payment_provider && (
            <Row label="Pagamento" value={booking.payment_provider === "stripe" ? "Stripe" : "Mercado Pago"} />
          )}
          {booking.payment_id && (
            <Row label="ID do pagamento" value={booking.payment_id} mono />
          )}
          <Row label="Criada em" value={new Date(booking.created_at).toLocaleString("pt-BR")} />
          {booking.voucher_sent_at && (
            <Row label="Voucher enviado em" value={new Date(booking.voucher_sent_at).toLocaleString("pt-BR")} />
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <BookingActions
        bookingId={booking.id}
        currentStatus={booking.status}
        tenantId={membership!.tenant_id}
      />
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-right ${bold ? "font-bold text-base" : ""} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
