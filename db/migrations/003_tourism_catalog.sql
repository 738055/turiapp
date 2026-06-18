-- ════════════════════════════════════════════════════════════════
-- 003 — Tourism Catalog (products, rates, availability, bookings, customers)
-- ════════════════════════════════════════════════════════════════

-- ── Products ──────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  module            text not null check (module in ('hospedagem','receptivo','emissivo')),
  type              text not null,
  title             text not null,
  slug              text not null,
  description       text not null default '',
  images            text[] not null default '{}',
  status            text not null default 'draft'
    check (status in ('draft','published','archived')),
  sale_mode         text not null default 'whatsapp'
    check (sale_mode in ('booking','whatsapp')),
  whatsapp_number   text,
  extra_data        jsonb not null default '{}',
  seo_title         text,
  seo_description   text,
  og_image_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists products_tenant_id_idx on products(tenant_id);
create index if not exists products_tenant_module_idx on products(tenant_id, module);
create index if not exists products_tenant_status_idx on products(tenant_id, status);
create index if not exists products_tenant_slug_idx on products(tenant_id, slug);

create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

-- ── Product Rates (tarifário) ──────────────────────────────────
create table if not exists product_rates (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  name            text not null,
  price           numeric(10,2) not null,
  currency        text not null default 'BRL',
  rate_type       text not null default 'fixed'
    check (rate_type in ('per_night','per_person','per_group','fixed')),
  valid_from      date,
  valid_to        date,
  season_name     text,
  occupancy_min   integer not null default 1,
  occupancy_max   integer not null default 99,
  available       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists product_rates_product_id_idx on product_rates(product_id);

-- ── Availability ──────────────────────────────────────────────
create table if not exists availability (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  date              date not null,
  available_slots   integer not null default 0,
  blocked           boolean not null default false,
  note              text,
  unique (product_id, date)
);

create index if not exists availability_product_date_idx on availability(product_id, date);

-- ── Customers ─────────────────────────────────────────────────
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  document    text,
  birth_date  date,
  address     jsonb,
  lgpd_consent_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, email)
);

create index if not exists customers_tenant_id_idx on customers(tenant_id);
create index if not exists customers_tenant_email_idx on customers(tenant_id, email);

create trigger customers_updated_at before update on customers
  for each row execute function update_updated_at();

-- ── Bookings ──────────────────────────────────────────────────
create table if not exists bookings (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  product_id          uuid not null references products(id),
  product_rate_id     uuid references product_rates(id),
  customer_id         uuid references customers(id),
  -- Customer snapshot (in case customer is deleted)
  customer_name       text not null,
  customer_email      text not null,
  customer_phone      text,
  check_in            date,
  check_out           date,
  guests              integer not null default 1,
  total_price         numeric(10,2) not null,
  currency            text not null default 'BRL',
  status              text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','refunded','completed')),
  payment_provider    text check (payment_provider in ('stripe','mercadopago')),
  payment_id          text,
  payment_url         text,
  voucher_sent_at     timestamptz,
  notes               text,
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists bookings_tenant_id_idx on bookings(tenant_id);
create index if not exists bookings_product_id_idx on bookings(product_id);
create index if not exists bookings_customer_id_idx on bookings(customer_id);
create index if not exists bookings_status_idx on bookings(tenant_id, status);
create index if not exists bookings_check_in_idx on bookings(tenant_id, check_in);

create trigger bookings_updated_at before update on bookings
  for each row execute function update_updated_at();

-- ── Orders & Order Items (ingressos, pacotes) ─────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  customer_id     uuid references customers(id),
  customer_name   text not null,
  customer_email  text not null,
  total_price     numeric(10,2) not null,
  currency        text not null default 'BRL',
  status          text not null default 'pending'
    check (status in ('pending','paid','cancelled','refunded')),
  payment_provider text check (payment_provider in ('stripe','mercadopago')),
  payment_id      text,
  voucher_sent_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_tenant_id_idx on orders(tenant_id);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  rate_id     uuid references product_rates(id),
  quantity    integer not null default 1,
  unit_price  numeric(10,2) not null,
  subtotal    numeric(10,2) not null,
  date        date,
  extra_data  jsonb not null default '{}'
);

create index if not exists order_items_order_id_idx on order_items(order_id);

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
