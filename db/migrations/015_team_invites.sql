-- ════════════════════════════════════════════════════════════════
-- 015 — Team invites (Etapa 16). Multi-user per tenant.
--
-- NOTA: a partir desta migration as policies usam as funções auxiliares de RLS
-- (current_user_tenant_id / is_super_admin / has_tenant_role). Elas vivem em
-- db/policies/rls.sql (que roda no fim), então as criamos aqui também — com
-- `create or replace`, idempotente: redefini-las no rls.sql depois não causa
-- conflito. Sem este bloco, a migration falha com
-- "function current_user_tenant_id() does not exist".
-- ════════════════════════════════════════════════════════════════
create or replace function current_user_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from tenant_members where user_id = auth.uid() limit 1;
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tenant_members where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function has_tenant_role(min_role text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tenant_members
    where user_id = auth.uid()
      and role = any(
        case min_role
          when 'tenant_staff'  then array['tenant_staff','tenant_admin','tenant_owner','super_admin']
          when 'tenant_admin'  then array['tenant_admin','tenant_owner','super_admin']
          when 'tenant_owner'  then array['tenant_owner','super_admin']
          when 'super_admin'   then array['super_admin']
          else array[]::text[]
        end
      )
  );
$$;

-- ════════════════════════════════════════════════════════════════
-- Invites
--
-- Security model (additive, never weakens existing protections):
--   • Only the SHA-256 hash of the invite token is persisted — the plaintext
--     token lives only in the email link, same pattern as api_keys.key_hash
--     and mfa_backup_codes.code_hash. A database dump never reveals a usable
--     token.
--   • `role` is constrained to tenant_admin / tenant_staff ONLY. An invite can
--     never mint a tenant_owner or super_admin — privilege escalation via the
--     invite path is impossible at the schema level, not just in app code.
--   • All writes happen through service_role API routes (app/api/team/**), which
--     additionally enforce: caller role, plan member limit, and that the
--     accepting user's email matches the invite. RLS below only grants tenant
--     admins READ of their own tenant's invites (for the /equipe list); the
--     token_hash column is never selected by the app (DTO).
-- ════════════════════════════════════════════════════════════════
create table if not exists invites (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  email        text not null,
  role         text not null check (role in ('tenant_admin','tenant_staff')),
  token_hash   text not null unique,
  invited_by   uuid references auth.users(id) on delete set null,
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists invites_tenant_id_idx on invites(tenant_id);
create index if not exists invites_token_hash_idx on invites(token_hash);
-- One live (un-accepted, un-revoked) invite per email per tenant.
create unique index if not exists invites_pending_unique
  on invites(tenant_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table invites enable row level security;

-- Tenant admins/owners may read their own tenant's invites (the app selects an
-- explicit DTO and never exposes token_hash). Inserts/updates are service_role
-- only — done by the API routes after their own authorization checks.
drop policy if exists "invites_own_read" on invites;
create policy "invites_own_read" on invites
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));

drop policy if exists "invites_super_admin" on invites;
create policy "invites_super_admin" on invites
  for all using (is_super_admin());
