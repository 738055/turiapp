import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { OrderCheckoutWidget } from "@/components/public/OrderCheckoutWidget";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderCheckoutPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { cancelled } = await searchParams;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const service = createServiceClient();
  const [{ data: order }, { data: bookings }, { data: paymentAccounts }, { data: theme }] = await Promise.all([
    service.from("orders").select("id, total_price, currency, status").eq("id", orderId).eq("tenant_id", tenantId ?? "").single(),
    service.from("bookings").select("id, total_price, currency, check_in, guests, products(title)").eq("order_id", orderId).eq("tenant_id", tenantId ?? ""),
    service.from("tenant_payment_accounts").select("provider, status").eq("tenant_id", tenantId ?? "").eq("status", "connected"),
    service.from("themes").select("primary_color").eq("tenant_id", tenantId ?? "").maybeSingle(),
  ]);

  if (!order) notFound();

  const primaryColor = theme?.primary_color ?? "#0ea5e9";

  if (order.status === "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-green-800">Pedido confirmado!</h1>
          <p className="text-gray-600 text-sm">Você receberá os vouchers por e-mail.</p>
        </div>
      </main>
    );
  }

  const items = bookings ?? [];
  const hasStripe = paymentAccounts?.some((a) => a.provider === "stripe") ?? false;
  const hasMp = paymentAccounts?.some((a) => a.provider === "mercadopago") ?? false;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Finalizar pedido</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} {items.length === 1 ? "item" : "itens"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border divide-y">
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{(b.products as unknown as { title: string } | null)?.title ?? "Item"}</p>
                <p className="text-xs text-gray-400">
                  {b.check_in ? new Date((b.check_in as string) + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                  {b.guests ? ` · ${b.guests} ${b.guests === 1 ? "pessoa" : "pessoas"}` : ""}
                </p>
              </div>
              <span className="font-semibold flex-shrink-0">{formatCurrency(b.total_price as number, (b.currency as string) ?? "BRL")}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="rounded-lg bg-gray-50 px-5 py-4 flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Total a pagar</span>
            <span className="text-xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(order.total_price as number, (order.currency as string) ?? "BRL")}
            </span>
          </div>
          <OrderCheckoutWidget
            orderId={orderId}
            tenantId={tenantId ?? ""}
            hasStripe={hasStripe}
            hasMp={hasMp}
            primaryColor={primaryColor}
            cancelled={cancelled === "1"}
          />
        </div>
      </div>
    </main>
  );
}
