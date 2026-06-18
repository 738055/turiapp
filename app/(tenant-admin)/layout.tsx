import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getMfaGateStatus } from "@/lib/auth/mfa-gate";

export default async function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(name, slug, status, subscription_status)")
    .eq("user_id", user.id)
    .in("role", ["owner", "tenant_owner", "tenant_admin", "tenant_staff"])
    .single();

  if (!membership) redirect("/login");

  // MFA is optional for tenant users, but once enrolled it must be challenged
  // at every login — otherwise enrolling would be cosmetic. See lib/auth/mfa-gate.ts.
  const mfaStatus = await getMfaGateStatus(supabase, user.id, { forceEnroll: false });
  if (mfaStatus === "challenge") redirect("/mfa?next=/dashboard");

  const tenant = membership.tenants as unknown as {
    name: string;
    slug: string;
    status: string;
    subscription_status: string | null;
  } | null;

  // Billing health banner: past_due = grace warning, suspended = storefront down.
  const billingState =
    tenant?.status === "suspended"
      ? "suspended"
      : tenant?.subscription_status === "past_due"
      ? "past_due"
      : null;

  return (
    <div className="admin-layout flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        tenantName={tenant?.name ?? ""}
        tenantSlug={tenant?.slug ?? ""}
        role={membership.role}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} tenantName={tenant?.name ?? ""} tenantId={membership.tenant_id} />
        {billingState && (
          <div
            className={`flex items-center justify-between gap-3 px-6 py-2.5 text-sm ${
              billingState === "suspended" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            <span>
              {billingState === "suspended"
                ? "Sua assinatura está suspensa e sua loja está fora do ar. Regularize o pagamento para reativá-la."
                : "Não conseguimos processar o pagamento da sua assinatura. Atualize seus dados para evitar a suspensão."}
            </span>
            <a
              href="/configuracoes/assinatura"
              className={`flex-shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
                billingState === "suspended" ? "bg-white text-red-700" : "bg-amber-600 text-white"
              }`}
            >
              Regularizar pagamento
            </a>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
