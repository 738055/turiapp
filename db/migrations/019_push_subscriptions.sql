-- ════════════════════════════════════════════════════════════════
-- 019 — Web Push subscriptions (Etapa 20 / PWA).
--
-- One row per browser/device a panel user opted into push on. Only the user
-- who owns the subscription can read/delete it; sending happens via service_role
-- in lib/push/send.ts. Dead endpoints (HTTP 404/410) are pruned on send.
-- ════════════════════════════════════════════════════════════════
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_tenant_idx on push_subscriptions(tenant_id);
create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_own" on push_subscriptions;
create policy "push_subscriptions_own" on push_subscriptions
  for all using (user_id = auth.uid());

drop policy if exists "push_subscriptions_super_admin" on push_subscriptions;
create policy "push_subscriptions_super_admin" on push_subscriptions
  for select using (is_super_admin());
