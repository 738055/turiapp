-- ════════════════════════════════════════════════════════════════
-- 022 — Affiliate / referral program (Etapa 30).
--
-- An affiliate is any platform user with a referral code. When a new tenant
-- signs up carrying that code (captured from ?ref= into a cross-subdomain
-- cookie), a referral row is created (pending). When the tenant starts paying,
-- the platform billing webhook marks it converted and computes the commission.
-- ════════════════════════════════════════════════════════════════
create table if not exists affiliates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  code               text not null unique,
  commission_percent numeric(5,2) not null default 20,
  created_at         timestamptz not null default now()
);

create index if not exists affiliates_code_idx on affiliates(code);

create table if not exists affiliate_referrals (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid not null references affiliates(id) on delete cascade,
  tenant_id         uuid not null references tenants(id) on delete cascade,
  status            text not null default 'pending'
    check (status in ('pending','converted','paid','cancelled')),
  commission_amount numeric(10,2) not null default 0,
  created_at        timestamptz not null default now(),
  converted_at      timestamptz,
  -- A tenant can only ever be attributed to one affiliate.
  unique (tenant_id)
);

create index if not exists affiliate_referrals_affiliate_idx on affiliate_referrals(affiliate_id);

alter table affiliates enable row level security;
alter table affiliate_referrals enable row level security;

-- An affiliate reads/manages only their own row; writes happen via service_role
-- API routes. Referrals are readable by the owning affiliate.
drop policy if exists "affiliates_own" on affiliates;
create policy "affiliates_own" on affiliates
  for select using (user_id = auth.uid());

drop policy if exists "affiliates_super_admin" on affiliates;
create policy "affiliates_super_admin" on affiliates
  for all using (is_super_admin());

drop policy if exists "affiliate_referrals_own" on affiliate_referrals;
create policy "affiliate_referrals_own" on affiliate_referrals
  for select using (
    affiliate_id in (select id from affiliates where user_id = auth.uid())
  );

drop policy if exists "affiliate_referrals_super_admin" on affiliate_referrals;
create policy "affiliate_referrals_super_admin" on affiliate_referrals
  for all using (is_super_admin());
