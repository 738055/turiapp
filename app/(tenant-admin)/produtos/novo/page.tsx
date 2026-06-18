import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

export default async function NovoProdutoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(subscription_status)")
    .eq("user_id", user!.id)
    .single();

  const { data: integrations } = await supabase
    .from("tenant_integrations")
    .select("whatsapp_number")
    .eq("tenant_id", membership!.tenant_id)
    .single();

  const limits = await getPlanLimits(createServiceClient(), membership!.tenant_id);
  const bookingEngineAllowed = featureAllowed(limits, "booking_engine");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Novo produto</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados do seu produto turístico</p>
      </div>
      <ProductForm
        tenantId={membership!.tenant_id}
        defaultWhatsapp={integrations?.whatsapp_number ?? ""}
        mode="create"
        bookingEngineAllowed={bookingEngineAllowed}
      />
    </div>
  );
}
