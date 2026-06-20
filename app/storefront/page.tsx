import PublicLayout from "../(public)/layout";
import StorefrontHome from "../(public)/page";

export const dynamic = "force-dynamic";

export default function TenantStorefrontHome() {
  return (
    <PublicLayout>
      <StorefrontHome />
    </PublicLayout>
  );
}
