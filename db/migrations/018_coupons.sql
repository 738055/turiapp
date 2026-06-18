-- ════════════════════════════════════════════════════════════════
-- 018 — Discount coupons (Etapa 24).
--
-- Coupons are validated/applied via service_role API routes (the storefront has
-- no direct table access). Usage is counted at apply time and guarded by
-- max_uses; a booking can only carry one coupon (idempotent re-apply), so the
-- count is not inflated by re-submitting the same checkout.
-- ════════════════════════════════════════════════════════════════
create table if not exists coupons (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  code        text not null,
  type        text not null check (type in ('percent','fixed')),
  value       numeric(10,2) not null check (value >= 0),
  min_order   numeric(10,2) not null default 0,
  max_uses    integer,                       -- null = unlimited
  uses_count  integer not null default 0,
  expires_at  timestamptz,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Case-insensitive uniqueness of the code within a tenant.
create unique index if not exists coupons_tenant_code_idx on coupons(tenant_id, upper(code));
create index if not exists coupons_tenant_idx on coupons(tenant_id);

alter table coupons enable row level security;

drop policy if exists "coupons_own_manage" on coupons;
create policy "coupons_own_manage" on coupons
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));

drop policy if exists "coupons_super_admin" on coupons;
create policy "coupons_super_admin" on coupons
  for all using (is_super_admin());

-- Coupon applied to a booking (snapshot — the booking total is already reduced).
alter table bookings add column if not exists coupon_code text;
alter table bookings add column if not exists coupon_discount_amount numeric(10,2) not null default 0;

-- Atomic, race-safe increment of a coupon's usage that also re-checks max_uses.
-- Returns true if the use was counted, false if the coupon is exhausted.
create or replace function consume_coupon(p_coupon_id uuid)
returns boolean language plpgsql security definer as $$
declare
  ok boolean;
begin
  update coupons
     set uses_count = uses_count + 1
   where id = p_coupon_id
     and (max_uses is null or uses_count < max_uses)
  returning true into ok;
  return coalesce(ok, false);
end;
$$;
