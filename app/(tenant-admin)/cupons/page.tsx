import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { CouponsManager } from "@/components/admin/CouponsManager";
import type { Coupon } from "@/types";

export const dynamic = "force-dynamic";

export default async function CuponsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();
  if (!membership) redirect("/login");
  if (!roleAtLeast(membership.role, "tenant_admin")) redirect("/dashboard");

  const { data: coupons } = await service
    .from("coupons")
    .select("*")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Cupons de desconto</h1>
        <p className="text-gray-500 text-sm mt-1">
          Crie códigos promocionais que seus clientes aplicam no checkout.
        </p>
      </div>
      <CouponsManager tenantId={membership.tenant_id} coupons={(coupons ?? []) as Coupon[]} />
    </div>
  );
}
