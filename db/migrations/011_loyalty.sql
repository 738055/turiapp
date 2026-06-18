-- ════════════════════════════════════════════════════════════════
-- 011 — Programa de fidelidade (Etapa 36)
-- ════════════════════════════════════════════════════════════════

-- ── Regras do programa, configuráveis por tenant via painel ────────────
create table if not exists loyalty_settings (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null unique references tenants(id) on delete cascade,
  active                  boolean not null default false,
  earn_mode               text not null default 'per_amount' check (earn_mode in ('per_amount', 'per_booking')),
  points_per_amount       numeric(10,4) not null default 1,
  points_per_booking      integer not null default 100,
  redeem_value_per_point  numeric(10,4) not null default 0.1,
  min_redeem_points       integer not null default 100,
  updated_at              timestamptz not null default now()
);

create trigger loyalty_settings_updated_at before update on loyalty_settings
  for each row execute function update_updated_at();

-- ── Extrato de pontos (ledger) — entradas (earn) e saídas (redeem) ──────
create table if not exists loyalty_points (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  customer_id     uuid not null references customers(id) on delete cascade,
  points          integer not null,
  type            text not null check (type in ('earn', 'redeem')),
  reference_type  text,
  reference_id    uuid,
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists loyalty_points_tenant_customer_idx on loyalty_points(tenant_id, customer_id);
create index if not exists loyalty_points_reference_idx on loyalty_points(reference_type, reference_id);

-- ── Códigos de login por email (OTP) — só o hash é persistido ───────────
create table if not exists loyalty_login_codes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  email        text not null,
  code_hash    text not null,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  attempts     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists loyalty_login_codes_lookup_idx on loyalty_login_codes(tenant_id, email, created_at desc);

-- ── Sessões de cliente — só o hash do token é persistido ────────────────
create table if not exists loyalty_sessions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  customer_id  uuid not null references customers(id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists loyalty_sessions_customer_idx on loyalty_sessions(customer_id);

-- ── Desconto de fidelidade aplicado na reserva ──────────────────────────
alter table bookings
  add column if not exists loyalty_points_redeemed integer not null default 0,
  add column if not exists loyalty_discount_amount numeric(10,2) not null default 0;
