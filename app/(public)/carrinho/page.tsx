import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CartView } from "@/components/public/CartView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CarrinhoPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Seu carrinho</h1>
        <CartView tenantId={tenantId ?? ""} />
      </div>
    </main>
  );
}
