import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { QuoteResponseWidget } from "@/components/public/QuoteResponseWidget";

interface QuotePageProps {
  params: Promise<{ token: string }>;
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("token", token)
    .single();

  if (!quote) notFound();

  const [{ data: product }, { data: tenant }, { data: lead }, { data: theme }] = await Promise.all([
    supabase.from("products").select("title, images").eq("id", quote.product_id).single(),
    supabase.from("tenants").select("name").eq("id", quote.tenant_id).single(),
    supabase.from("leads").select("name").eq("id", quote.lead_id).single(),
    supabase.from("themes").select("primary_color, logo_url").eq("tenant_id", quote.tenant_id).single(),
  ]);

  const primaryColor = theme?.primary_color ?? "#0ea5e9";
  const isExpired = new Date(quote.expires_at) < new Date() && quote.status === "pending";
  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : null);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl border overflow-hidden">
        <div className="p-8 text-center text-white" style={{ backgroundColor: primaryColor }}>
          {theme?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={theme.logo_url} alt={tenant?.name ?? ""} className="h-10 mx-auto mb-3" />
          )}
          <p className="text-sm opacity-80">{tenant?.name ?? "Cotação"}</p>
          <h1 className="text-2xl font-bold mt-1">Sua cotação personalizada</h1>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-gray-600">
            Olá, <strong>{lead?.name ?? "cliente"}</strong>! Preparamos uma proposta especial para você.
          </p>

          <div className="rounded-xl border bg-gray-50 p-5 space-y-2">
            <h2 className="font-semibold text-lg">{product?.title ?? "Produto"}</h2>
            {formatDate(quote.check_in) && (
              <p className="text-sm text-gray-600">Check-in: {formatDate(quote.check_in)}</p>
            )}
            {formatDate(quote.check_out) && (
              <p className="text-sm text-gray-600">Check-out: {formatDate(quote.check_out)}</p>
            )}
            <p className="text-sm text-gray-600">Pessoas: {quote.guests}</p>
            {quote.notes && <p className="text-sm text-gray-600 whitespace-pre-line">{quote.notes}</p>}
            <div className="border-t pt-3 mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {formatCurrency(quote.total_price, quote.currency)}
              </span>
            </div>
          </div>

          <QuoteResponseWidget
            token={token}
            status={quote.status}
            isExpired={isExpired}
            expiresAt={quote.expires_at}
            primaryColor={primaryColor}
            bookingId={quote.booking_id}
          />
        </div>
      </div>
    </main>
  );
}
