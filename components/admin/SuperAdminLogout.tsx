"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SuperAdminLogout() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
      title="Sair"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sair
    </button>
  );
}
