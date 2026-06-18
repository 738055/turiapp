-- ════════════════════════════════════════════════════════════════
-- 004 — Payments & Integrations
-- ════════════════════════════════════════════════════════════════

-- ── Tenant Payment Accounts ────────────────────────────────────
-- Credentials stored ENCRYPTED at application level before insert.
-- Do NOT store plain-text keys here.
create table if not exists tenant_payment_accounts (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  provider              text not null check (provider in ('stripe','mercadopago')),
  status                text not null default 'disconnected'
    check (status in ('connected','disconnected','error')),
  -- AES-256-GCM encrypted JSON blob: { publicKey, secretKey, ... }
  encrypted_credentials text,
  display_name          text,
  account_email         text,
  connected_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index if not exists tenant_payment_accounts_tenant_id_idx
  on tenant_payment_accounts(tenant_id);

create trigger tenant_payment_accounts_updated_at
  before update on tenant_payment_accounts
  for each row execute function update_updated_at();

-- ── Tenant Integrations (SEO, Pixels, WhatsApp) ───────────────
create table if not exists tenant_integrations (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null unique references tenants(id) on delete cascade,
  -- SEO / Analytics
  google_analytics_id       text,
  google_tag_manager_id     text,
  -- Ad pixels
  facebook_pixel_id         text,
  tiktok_pixel_id           text,
  google_ads_id             text,
  -- WhatsApp (default for products with sale_mode=whatsapp)
  whatsapp_number           text,
  -- LGPD
  cookie_consent_enabled    boolean not null default true,
  cookie_consent_text       text,
  privacy_policy_url        text,
  -- Custom head / body scripts (sanitized HTML only)
  head_scripts              text,
  updated_at                timestamptz not null default now()
);

create index if not exists tenant_integrations_tenant_id_idx
  on tenant_integrations(tenant_id);

create trigger tenant_integrations_updated_at
  before update on tenant_integrations
  for each row execute function update_updated_at();

-- ── Onboarding Checklist State ────────────────────────────────
create table if not exists tenant_onboarding (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null unique references tenants(id) on delete cascade,
  step_completed        text[] not null default '{}',
  wizard_dismissed      boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger tenant_onboarding_updated_at
  before update on tenant_onboarding
  for each row execute function update_updated_at();
