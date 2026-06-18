import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ bookingId?: string; status?: string }>;
}

export default async function CheckoutSucessoPage({ searchParams }: PageProps) {
  const { bookingId, status } = await searchParams;

  if (!bookingId) notFound();

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  const service = createServiceClient();

  const { data: booking } = await service
    .from("bookings")
    .select("*, products(title)")
    .eq("id", bookingId)
    .eq("tenant_id", tenantId ?? "")
    .single();

  const { data: theme } = await service
    .from("themes")
    .select("primary_color, logo_url")
    .eq("tenant_id", tenantId ?? "")
    .single();

  const primaryColor = theme?.primary_color ?? "#0ea5e9";
  const isPending = status === "pending";

  const productTitle = typeof booking?.products === "object" && booking?.products !== null
    ? (booking.products as { title: string }).title
    : "Produto";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center space-y-5">
        <div className="text-6xl">{isPending ? "⏳" : "✅"}</div>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: isPending ? "#b45309" : "#166534" }}>
            {isPending ? "Pagamento em processamento" : "Pagamento confirmado!"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isPending
              ? "Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail assim que aprovado."
              : "Sua reserva está confirmada. O voucher foi enviado para o seu e-mail."}
          </p>
        </div>

        {booking && (
          <div className="rounded-xl border bg-gray-50 p-4 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Produto</span>
              <span className="font-medium">{productTitle}</span>
            </div>
            {booking.check_in && (
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span>{new Date(booking.check_in + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {booking.check_out && (
              <div className="flex justify-between">
                <span className="text-gray-500">Check-out</span>
                <span>{new Date(booking.check_out + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total pago</span>
              <span style={{ color: primaryColor }}>
                {formatCurrency(booking.total_price as number, (booking.currency as string) ?? "BRL")}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Código da reserva: <span className="font-mono font-medium">{bookingId.slice(0, 8).toUpperCase()}</span>
        </p>

        <a
          href="/"
          className="inline-block text-sm font-medium underline"
          style={{ color: primaryColor }}
        >
          Voltar ao início
        </a>
      </div>
    </main>
  );
}
