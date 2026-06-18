import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SuperAdminLogout } from "@/components/admin/SuperAdminLogout";
import { requireAal2ForSuperAdmin } from "@/lib/auth/super-admin";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/assinaturas", label: "Assinaturas" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/audit", label: "Auditoria" },
  { href: "/admin/seguranca", label: "Segurança" },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) redirect("/dashboard");

  // MFA/TOTP is mandatory for super admin — see lib/auth/mfa-gate.ts. Redirect
  // targets live outside this layout's own tree (app/(auth)/*) to avoid a
  // redirect loop with the gate re-running on the destination page.
  const mfaStatus = await requireAal2ForSuperAdmin(supabase, user.id);
  if (mfaStatus === "enroll") redirect("/mfa-enroll?next=/admin");
  if (mfaStatus === "challenge") redirect("/mfa?next=/admin");

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Super Admin</p>
          <p className="font-bold text-white">TuriApp</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-2">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <SuperAdminLogout />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
