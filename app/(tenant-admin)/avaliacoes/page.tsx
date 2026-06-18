import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ReviewModeration } from "@/components/admin/ReviewModeration";
import type { Review } from "@/types";

export const dynamic = "force-dynamic";

export default async function AvaliacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) redirect("/login");

  const tenantId = membership.tenant_id;

  // Only submitted reviews are actionable; group by moderation status.
  const { data: reviews } = await service
    .from("reviews")
    .select("id, product_id, customer_name, rating, body, status, submitted_at, created_at, products(title)")
    .eq("tenant_id", tenantId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });

  const rows = (reviews ?? []).map((r) => ({
    ...(r as unknown as Review),
    productTitle: (r.products as unknown as { title: string } | null)?.title ?? "Produto",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Modere as avaliações dos clientes. Só as aprovadas aparecem no seu site.
        </p>
      </div>
      <ReviewModeration tenantId={tenantId} reviews={rows} />
    </div>
  );
}
