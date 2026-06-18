import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { CheckoutWidget } from "@/components/public/CheckoutWidget";
import { LoyaltyRedeemWidget } from "@/components/public/LoyaltyRedeemWidget";
import { CouponWidget } from "@/components/public/CouponWidget";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { bookingId } = await params;
  const { cancelled } = await searchParams;

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const service = createServiceClient();

  const [{ data: booking }, { data: paymentAccounts }, { data: theme }, { data: loyaltySettings }] = await Promise.all([
    service
      .from("bookings")
      .select("*, products(title, images)")
      .eq("id", bookingId)
      .eq("tenant_id", tenantId ?? "")
      .single(),
    service
      .from("tenant_payment_accounts")
      .select("provider, status")
      .eq("tenant_id", tenantId ?? "")
      .eq("status", "connected"),
    service
      .from("themes")
      .select("primary_color")
      .eq("tenant_id", tenantId ?? "")
      .single(),
    service
      .from("loyalty_settings")
      .select("active")
      .eq("tenant_id", tenantId ?? "")
      .maybeSingle(),
  ]);

  if (!booking) notFound();

  // Already paid — redirect to success
  if (booking.status === "confirmed") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-green-800">Pagamento confirmado!</h1>
          <p className="text-gray-600 text-sm">
            Sua reserva está confirmada. Você receberá o voucher por e-mail.
          </p>
          <p className="text-xs text-gray-400">Código: {bookingId.slice(0, 8).toUpperCase()}</p>
        </div>
      </main>
    );
  }

  const productTitle = typeof booking.products === "object" && booking.products !== null
    ? (booking.products as { title: string; images?: string[] }).title
    : "Produto";

  const productImage = typeof booking.products === "object" && booking.products !== null
    ? (booking.products as { title: string; images?: string[] }).images?.[0]
    : undefined;

  const hasStripe = paymentAccounts?.some((a) => a.provider === "stripe") ?? false;
  const hasMp = paymentAccounts?.some((a) => a.provider === "mercadopago") ?? false;
  const primaryColor = theme?.primary_color ?? "#0ea5e9";

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Finalizar reserva</h1>
          <p className="text-sm text-gray-500 mt-1">Revise os detalhes e efetue o pagamento</p>
        </div>

        {/* Booking summary card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="flex gap-4 items-start">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                🏖️
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-base leading-tight">{productTitle}</h2>
              <p className="text-xs text-gray-400 mt-1">
                {booking.check_in
                  ? `${new Date(booking.check_in + "T12:00:00").toLocaleDateString("pt-BR")}${
                      booking.check_out
                        ? ` → ${new Date(booking.check_out + "T12:00:00").toLocaleDateString("pt-BR")}`
                        : ""
                    }`
                  : "Data a confirmar"}
              </p>
              {booking.guests && (
                <p className="text-xs text-gray-400">
                  {booking.guests} {booking.guests === 1 ? "pessoa" : "pessoas"}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Nome</span>
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>E-mail</span>
              <span className="truncate ml-4">{booking.customer_email}</span>
            </div>
          </div>
        </div>

        {loyaltySettings?.active && booking.loyalty_points_redeemed === 0 && (
          <LoyaltyRedeemWidget
            tenantId={tenantId ?? ""}
            bookingId={bookingId}
            customerEmail={booking.customer_email as string}
            currency={(booking.currency as string) ?? "BRL"}
            primaryColor={primaryColor}
          />
        )}

        <CouponWidget
          tenantId={tenantId ?? ""}
          bookingId={bookingId}
          currency={(booking.currency as string) ?? "BRL"}
          primaryColor={primaryColor}
          appliedCode={(booking.coupon_code as string | null) ?? null}
          appliedDiscount={Number(booking.coupon_discount_amount ?? 0)}
        />

        {/* Payment section */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <CheckoutWidget
            bookingId={bookingId}
            tenantId={tenantId ?? ""}
            totalPrice={booking.total_price as number}
            currency={(booking.currency as string) ?? "BRL"}
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
