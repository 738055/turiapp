import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { checkTeamLimit } from "@/lib/team/invites";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/login");

  // Only owners and admins manage the team. Staff don't see this page.
  if (!roleAtLeast(membership.role, "tenant_admin")) redirect("/dashboard");

  const tenantId = membership.tenant_id;

  const [{ data: rawMembers }, { data: rawInvites }, limit] = await Promise.all([
    service
      .from("tenant_members")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
    // DTO: never select token_hash.
    service
      .from("invites")
      .select("id, email, role, expires_at, created_at")
      .eq("tenant_id", tenantId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    checkTeamLimit(tenantId),
  ]);

  // Resolve emails from auth.users (not stored in tenant_members).
  const members = await Promise.all(
    (rawMembers ?? []).map(async (m) => {
      const { data: au } = await service.auth.admin.getUserById(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        email: au?.user?.email ?? "—",
        created_at: m.created_at,
        isSelf: m.user_id === user.id,
      };
    })
  );

  return (
    <TeamManager
      tenantId={tenantId}
      currentUserRole={membership.role}
      members={members}
      invites={rawInvites ?? []}
      seatLimit={limit}
    />
  );
}
