import type { Metadata } from "next";
import { headers } from "next/headers";
import { formatTenantPageTitle, resolveTenantSeoContextFromHeaders } from "@/lib/seo/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveTenantSeoContextFromHeaders(await headers());

  return {
    title: seo ? formatTenantPageTitle("Checkout seguro", seo.tenant.name) : "Checkout seguro",
    robots: { index: false, follow: false },
  };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
