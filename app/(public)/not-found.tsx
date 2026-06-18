import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PublicNotFound() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  let tenantName = "esta loja";
  let primaryColor = "#0ea5e9";
  let logoUrl: string | null = null;

  if (tenantId) {
    const service = createServiceClient();
    const [{ data: tenant }, { data: theme }] = await Promise.all([
      service.from("tenants").select("name").eq("id", tenantId).single(),
      service.from("themes").select("primary_color, logo_url").eq("tenant_id", tenantId).single(),
    ]);
    if (tenant) tenantName = tenant.name;
    if (theme) {
      primaryColor = theme.primary_color ?? primaryColor;
      logoUrl = theme.logo_url ?? null;
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        {logoUrl ? (
          <img src={logoUrl} alt={tenantName} className="h-14 mx-auto object-contain" />
        ) : (
          <div className="text-6xl">🧭</div>
        )}

        <div>
          <h1 className="text-6xl font-bold" style={{ color: primaryColor }}>404</h1>
          <h2 className="text-xl font-semibold mt-2">Página não encontrada</h2>
          <p className="text-gray-500 text-sm mt-2">
            A página que você procura não existe em {tenantName}.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
