-- ════════════════════════════════════════════════════════════════
-- 005 — Super Admin flag on user_profiles
-- ════════════════════════════════════════════════════════════════

alter table user_profiles
  add column if not exists is_super_admin boolean not null default false;

create index if not exists user_profiles_super_admin_idx
  on user_profiles(is_super_admin) where is_super_admin = true;
