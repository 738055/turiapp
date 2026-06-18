-- ════════════════════════════════════════════════════════════════
-- 012 — Security hardening (privilege escalation + scoped API keys
-- + private storage bucket)
-- ════════════════════════════════════════════════════════════════

-- ── Block self-escalation: client-facing roles (anon/authenticated, i.e.
--    PostgREST requests using the anon/user JWT) may never flip
--    user_profiles.is_super_admin or change tenant billing/status
--    columns. RLS "using" alone does not restrict which columns a
--    row-owner can write, so this must be enforced with a trigger.
--    Anything else (service_role, postgres/dashboard SQL editor,
--    migrations) is trusted and passes through. ──
create or replace function block_protected_column_changes()
returns trigger language plpgsql as $$
declare
  col text;
begin
  if coalesce(current_setting('role', true), '') not in ('anon', 'authenticated') then
    return new;
  end if;
  foreach col in array tg_argv loop
    if (to_jsonb(new) -> col) is distinct from (to_jsonb(old) -> col) then
      raise exception 'Coluna "%" só pode ser alterada pelo service role.', col;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists user_profiles_protect_columns on user_profiles;
create trigger user_profiles_protect_columns
  before update on user_profiles
  for each row execute function block_protected_column_changes('is_super_admin');

drop trigger if exists tenants_protect_columns on tenants;
create trigger tenants_protect_columns
  before update on tenants
  for each row execute function block_protected_column_changes(
    'status', 'plan_id', 'stripe_customer_id', 'subscription_status',
    'stripe_subscription_id', 'trial_ends_at'
  );

-- ── Scoped API keys (read_only vs full) ─────────────────────────────────
alter table api_keys
  add column if not exists scope text not null default 'full' check (scope in ('full', 'read_only'));

-- ── Private documents bucket (passports, signed contracts, etc).
--    Not public; access goes only through service-role server code
--    until a tenant-facing upload/RLS flow is built on top of it. ──
insert into storage.buckets (id, name, public)
values ('private_docs', 'private_docs', false)
on conflict (id) do nothing;
