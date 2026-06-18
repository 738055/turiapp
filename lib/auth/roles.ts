// Server-side role hierarchy helpers — mirror the SQL has_tenant_role() ladder
// in db/policies/rls.sql so API routes can authorize before touching the DB.
// These NEVER replace RLS; they are an additional in-app gate on top of it.

export type TenantRole = "super_admin" | "tenant_owner" | "tenant_admin" | "tenant_staff";

const RANK: Record<TenantRole, number> = {
  tenant_staff: 1,
  tenant_admin: 2,
  tenant_owner: 3,
  super_admin: 4,
};

// Legacy rows may carry role = 'owner' (pre-rename). Treat it as tenant_owner.
function normalize(role: string): TenantRole | null {
  if (role === "owner") return "tenant_owner";
  if (role in RANK) return role as TenantRole;
  return null;
}

/** True if `role` is at least `min` in the hierarchy. Unknown roles are denied. */
export function roleAtLeast(role: string, min: TenantRole): boolean {
  const r = normalize(role);
  if (!r) return false;
  return RANK[r] >= RANK[min];
}

/** Roles a given caller is allowed to assign to others (invite or role change).
 *  An owner may grant admin/staff; an admin may grant only staff; nobody may
 *  grant owner or super_admin through the team UI. */
export function assignableRoles(callerRole: string): TenantRole[] {
  const r = normalize(callerRole);
  if (r === "super_admin" || r === "tenant_owner") return ["tenant_admin", "tenant_staff"];
  if (r === "tenant_admin") return ["tenant_staff"];
  return [];
}
