-- ════════════════════════════════════════════════════════════════
-- 007 — CRM: Score, Segmentação e Histórico 360° (Etapa 31)
-- ════════════════════════════════════════════════════════════════

alter table customers add column if not exists tags text[] not null default '{}';
alter table customers add column if not exists internal_notes text;

create index if not exists customers_tags_idx on customers using gin (tags);

-- ── CRM Settings (por tenant, configurável via painel) ───────────
-- Define as faixas de score/segmentação usadas em /clientes.
-- Nunca hardcoded no código: cada tenant tem seu próprio ticket médio.
create table if not exists crm_settings (
  tenant_id         uuid primary key references tenants(id) on delete cascade,
  tier_prata_min    numeric(10,2) not null default 500,
  tier_ouro_min     numeric(10,2) not null default 2000,
  tier_vip_min      numeric(10,2) not null default 8000,
  risk_days         integer not null default 90,
  lost_days         integer not null default 180,
  new_days          integer not null default 30,
  updated_at        timestamptz not null default now()
);

create trigger crm_settings_updated_at before update on crm_settings
  for each row execute function update_updated_at();
