import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityCalendar } from "@/components/admin/AvailabilityCalendar";
import { IcalManager } from "@/components/admin/IcalManager";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function DisponibilidadePage({ params }: PageProps) {
  const { productId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const [{ data: product }, { data: availability }, { data: imports }] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, module, type, ical_token")
      .eq("id", productId)
      .eq("tenant_id", membership!.tenant_id)
      .single(),
    supabase
      .from("availability")
      .select("*")
      .eq("product_id", productId)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date"),
    supabase
      .from("product_ical_imports")
      .select("id, url, source_label, last_synced_at, last_error")
      .eq("product_id", productId)
      .order("created_at", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Disponibilidade</h1>
        <p className="text-gray-500 text-sm mt-1">{product.title}</p>
      </div>
      <AvailabilityCalendar
        productId={productId}
        tenantId={membership!.tenant_id}
        initialData={(availability ?? []) as Array<{
          id: string;
          date: string;
          available_slots: number;
          blocked: boolean;
          note: string | null;
        }>}
      />

      <IcalManager
        productId={productId}
        tenantId={membership!.tenant_id}
        icalToken={(product as { ical_token: string | null }).ical_token ?? ""}
        imports={(imports ?? []) as Array<{
          id: string;
          url: string;
          source_label: string | null;
          last_synced_at: string | null;
          last_error: string | null;
        }>}
      />
    </div>
  );
}
