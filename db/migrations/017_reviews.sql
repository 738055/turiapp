-- ════════════════════════════════════════════════════════════════
-- 017 — Reviews / UGC (Etapa 23). Post-stay reviews with moderation.
--
-- Flow: when a booking is marked "completed" the app creates a review row in
-- status 'pending' with submitted_at NULL and a single-use token (only the
-- SHA-256 hash is stored — same pattern as invites/api_keys). The customer
-- fills the public /avaliar/[token] page (sets rating/body/submitted_at, still
-- 'pending' = awaiting moderation). The tenant approves/rejects in /avaliacoes.
-- Only status='approved' AND submitted_at IS NOT NULL is shown publicly.
-- ════════════════════════════════════════════════════════════════
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  booking_id    uuid references bookings(id) on delete set null,
  customer_id   uuid references customers(id) on delete set null,
  customer_name text not null,
  rating        int check (rating between 1 and 5),
  body          text,
  token_hash    text not null unique,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at  timestamptz,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  -- One review invite per booking.
  unique (booking_id)
);

create index if not exists reviews_tenant_status_idx on reviews(tenant_id, status);
create index if not exists reviews_product_idx on reviews(product_id);
create index if not exists reviews_token_hash_idx on reviews(token_hash);

alter table reviews enable row level security;

-- Tenant staff+ read/moderate their tenant's reviews.
drop policy if exists "reviews_own_manage" on reviews;
create policy "reviews_own_manage" on reviews
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));

-- Public read is intentionally NOT granted here — the storefront reads approved
-- reviews via service_role (same as products/themes), keeping pending/rejected
-- rows (and token_hash) out of any client-reachable query.
drop policy if exists "reviews_super_admin" on reviews;
create policy "reviews_super_admin" on reviews
  for all using (is_super_admin());

-- Aggregate of approved reviews per product, for storefront stars/averages.
-- security_invoker so it respects the caller's RLS; the storefront reads it via
-- service_role anyway.
create or replace view product_review_stats
with (security_invoker = true) as
  select product_id,
         tenant_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*) as review_count
  from reviews
  where status = 'approved' and submitted_at is not null and rating is not null
  group by product_id, tenant_id;
