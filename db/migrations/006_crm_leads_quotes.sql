-- ════════════════════════════════════════════════════════════════
-- 006 — CRM: Leads & Cotações Digitais (Etapa 26)
-- ════════════════════════════════════════════════════════════════

-- ── Leads ─────────────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  name          text not null,
  email         text not null,
  phone         text,
  message       text,
  source        text not null default 'site' check (source in ('site','manual','import','api')),
  status        text not null default 'novo'
    check (status in ('novo','cotacao_enviada','negociando','reservado','perdido')),
  assigned_to   uuid references auth.users(id) on delete set null,
  lost_reason   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists leads_tenant_id_idx on leads(tenant_id);
create index if not exists leads_tenant_status_idx on leads(tenant_id, status);
create index if not exists leads_product_id_idx on leads(product_id);

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

-- ── Quotes (cotações digitais) ───────────────────────────────────
create table if not exists quotes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  product_id      uuid not null references products(id),
  rate_id         uuid references product_rates(id),
  check_in        date,
  check_out       date,
  guests          integer not null default 1,
  total_price     numeric(10,2) not null,
  currency        text not null default 'BRL',
  notes           text,
  token           text not null unique,
  status          text not null default 'pending'
    check (status in ('pending','accepted','declined','expired')),
  decline_reason  text,
  expires_at      timestamptz not null,
  sent_at         timestamptz,
  responded_at    timestamptz,
  booking_id      uuid references bookings(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists quotes_tenant_id_idx on quotes(tenant_id);
create index if not exists quotes_lead_id_idx on quotes(lead_id);
create index if not exists quotes_token_idx on quotes(token);
create index if not exists quotes_status_idx on quotes(tenant_id, status);
