-- ════════════════════════════════════════════════════════════════
-- 020 — iCal calendar sync (Etapa 25).
--
-- Export: each product gets a secret ical_token so the .ics feed URL is
-- unguessable (OTAs fetch it without a login). Import: external .ics URLs
-- (Airbnb/VRBO/Booking) are stored per product and their busy dates are written
-- as availability blocks.
-- ════════════════════════════════════════════════════════════════
alter table products add column if not exists ical_token text;
update products set ical_token = encode(gen_random_bytes(16), 'hex') where ical_token is null;
alter table products alter column ical_token set default encode(gen_random_bytes(16), 'hex');

create table if not exists product_ical_imports (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  product_id     uuid not null references products(id) on delete cascade,
  url            text not null,
  source_label   text,
  last_synced_at timestamptz,
  last_error     text,
  created_at     timestamptz not null default now(),
  unique (product_id, url)
);

create index if not exists product_ical_imports_tenant_idx on product_ical_imports(tenant_id);
create index if not exists product_ical_imports_product_idx on product_ical_imports(product_id);

alter table product_ical_imports enable row level security;

drop policy if exists "ical_imports_own_manage" on product_ical_imports;
create policy "ical_imports_own_manage" on product_ical_imports
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));

drop policy if exists "ical_imports_super_admin" on product_ical_imports;
create policy "ical_imports_super_admin" on product_ical_imports
  for all using (is_super_admin());
