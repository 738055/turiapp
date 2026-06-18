"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { PWARegister } from "@/components/pwa/PWARegister";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AdminHeaderProps {
  user: SupabaseUser;
  tenantName: string;
  tenantId: string;
}

export function AdminHeader({ user, tenantName, tenantId }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-sm font-medium text-gray-500">{tenantName}</h2>
      </div>
      <div className="flex items-center gap-2">
        <PWARegister tenantId={tenantId} />
        <NotificationBell tenantId={tenantId} />
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span className="text-xs text-gray-600 max-w-[120px] truncate">
            {user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-gray-500 hover:text-red-600"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
