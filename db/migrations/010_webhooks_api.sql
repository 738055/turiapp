-- ════════════════════════════════════════════════════════════════
-- 010 — Webhooks de saída e API pública (Etapa 34)
-- ════════════════════════════════════════════════════════════════

-- ── Endpoints de webhook configurados pelo tenant ───────────────────────
create table if not exists webhook_endpoints (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  url              text not null,
  secret_encrypted text not null,
  events           text[] not null default '{}',
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists webhook_endpoints_tenant_idx on webhook_endpoints(tenant_id);

-- ── Histórico de entregas (auditoria + retry com backoff) ───────────────
create table if not exists webhook_deliveries (
  id              uuid primary key default gen_random_uuid(),
  endpoint_id     uuid not null references webhook_endpoints(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null,
  status          text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  attempts        integer not null default 0,
  response_code   integer,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists webhook_deliveries_endpoint_idx on webhook_deliveries(endpoint_id, created_at desc);
create index if not exists webhook_deliveries_retry_idx on webhook_deliveries(status, next_attempt_at);

-- ── Chaves de API pública — só o hash é persistido, nunca a chave em si ──
create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,
  key_prefix   text not null,
  last_used_at timestamptz,
  created_at   timestamptz not null default now(),
  revoked_at   timestamptz
);

create index if not exists api_keys_tenant_idx on api_keys(tenant_id);
