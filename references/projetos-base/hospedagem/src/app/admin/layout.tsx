import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Allow login page without auth
  if (!session) {
    // The login page is rendered at /admin directly
    // Children check is done per-page with middleware
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2]">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
