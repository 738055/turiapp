import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { LoyaltyAccount } from "@/components/public/LoyaltyAccount";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FidelidadePublicPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId && process.env.NODE_ENV !== "development") notFound();

  const service = createServiceClient();
  const [{ data: settings }, { data: theme }] = await Promise.all([
    service.from("loyalty_settings").select("active").eq("tenant_id", tenantId ?? "").maybeSingle(),
    service.from("themes").select("primary_color").eq("tenant_id", tenantId ?? "").maybeSingle(),
  ]);

  if (!settings?.active) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">Programa de fidelidade não disponível nesta loja.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <LoyaltyAccount tenantId={tenantId ?? ""} primaryColor={theme?.primary_color ?? undefined} />
    </main>
  );
}
