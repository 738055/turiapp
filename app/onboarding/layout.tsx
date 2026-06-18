import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/dashboard");

  return <>{children}</>;
}
