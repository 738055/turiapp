-- ════════════════════════════════════════════════════════════════
-- 014 — MFA backup codes (Etapa 17). Recovery path for TOTP enrollment:
-- one-time codes, only the SHA-256 hash is ever persisted (same pattern
-- as api_keys.key_hash in lib/api-keys/auth.ts). The final fallback if
-- both the TOTP device and all backup codes are lost is removing the
-- factor via Supabase Studio (auth.mfa_factors), documented in STATUS.md.
-- ════════════════════════════════════════════════════════════════
create table if not exists mfa_backup_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists mfa_backup_codes_user_id_idx on mfa_backup_codes(user_id);

alter table mfa_backup_codes enable row level security;

drop policy if exists mfa_backup_codes_own_read on mfa_backup_codes;
create policy mfa_backup_codes_own_read on mfa_backup_codes
  for select using (user_id = auth.uid());

-- Insert/update/delete only via service_role (generation and consumption
-- both go through app/api/auth/mfa/* routes, never directly from the client).
