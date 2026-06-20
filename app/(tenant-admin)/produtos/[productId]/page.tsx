import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";
import type { Product, ProductRate } from "@/types";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  if (!membership) notFound();

  const [{ data: product }, { data: integrations }] = await Promise.all([
    supabase
      .from("products")
      .select("*, rates:product_rates(*)")
      .eq("id", productId)
      .eq("tenant_id", membership.tenant_id)
      .single(),
    supabase
      .from("tenant_integrations")
      .select("whatsapp_number")
      .eq("tenant_id", membership.tenant_id)
      .single(),
  ]);

  if (!product) notFound();

  const rawProduct = product as unknown as Product & { rates: ProductRate[] };
  const p = {
    ...rawProduct,
    rates: (rawProduct.rates ?? []).filter((rate) => rate.available !== false),
  };
  const limits = await getPlanLimits(createServiceClient(), membership.tenant_id);
  const bookingEngineAllowed = featureAllowed(limits, "booking_engine");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Editar produto</h1>
        <p className="text-gray-500 text-sm mt-1">{p.title}</p>
      </div>
      <ProductForm
        tenantId={membership.tenant_id}
        defaultWhatsapp={integrations?.whatsapp_number ?? ""}
        mode="edit"
        initialProduct={p}
        bookingEngineAllowed={bookingEngineAllowed}
      />
    </div>
  );
}
