import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

interface PageProps {
  searchParams: Promise<{ orderId?: string; status?: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const { orderId, status } = await searchParams;
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  let paid = false;
  if (orderId && tenantId) {
    const service = createServiceClient();
    const { data: order } = await service.from("orders").select("status").eq("id", orderId).eq("tenant_id", tenantId).maybeSingle();
    paid = order?.status === "paid";
  }

  const pending = status === "pending" || !paid;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-6xl">{paid ? "✅" : "⏳"}</div>
        <h1 className={`text-2xl font-bold ${paid ? "text-green-800" : "text-amber-700"}`}>
          {paid ? "Pedido confirmado!" : "Pagamento em processamento"}
        </h1>
        <p className="text-gray-600 text-sm">
          {paid
            ? "Você receberá os vouchers de cada item por e-mail."
            : "Assim que o pagamento for aprovado, você receberá os vouchers por e-mail."}
        </p>
        {pending && orderId && (
          <p className="text-xs text-gray-400">Pedido {orderId.slice(0, 8).toUpperCase()}</p>
        )}
      </div>
    </main>
  );
}
