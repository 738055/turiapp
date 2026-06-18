export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { TenantManageForm } from "@/components/superadmin/TenantManageForm";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { tenantId } = await params;
  const service = createServiceClient();

  const [{ data: tenant }, { data: domains }] = await Promise.all([
    service
      .from("tenants")
      .select("*, plans(name, price)")
      .eq("id", tenantId)
      .single(),
    service
      .from("tenant_domains")
      .select("*")
      .eq("tenant_id", tenantId),
  ]);

  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
        <p className="text-gray-400 text-sm mt-1 font-mono">{tenant.slug}</p>
      </div>
      <TenantManageForm tenant={tenant} domains={domains ?? []} />
    </div>
  );
}
