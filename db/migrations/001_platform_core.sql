-- ════════════════════════════════════════════════════════════════
-- 001 — Platform Core (tenants, users, plans, subscriptions)
-- ════════════════════════════════════════════════════════════════

-- Enable necessary extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ── Plans ──────────────────────────────────────────────────────
create table if not exists plans (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  tier                      text not null check (tier in ('basico','pro','premium')),
  price_monthly             numeric(10,2) not null default 0,
  price_yearly              numeric(10,2) not null default 0,
  stripe_price_id_monthly   text,
  stripe_price_id_yearly    text,
  limits                    jsonb not null default '{}',
  features                  text[] not null default '{}',
  active                    boolean not null default true,
  created_at                timestamptz not null default now()
);

-- Seed default plans
insert into plans (name, tier, price_monthly, price_yearly, limits, features) values
(
  'Básico', 'basico', 110.00, 1100.00,
  '{"max_products":20,"max_pages":5,"custom_domain":true,"pixel_integrations":false,"booking_engine":false,"max_team_members":1}',
  '{"Até 20 produtos","5 páginas","Botão WhatsApp","Subdomínio gratuito","Domínio próprio"}'
),
(
  'Pro', 'pro', 250.00, 2500.00,
  '{"max_products":100,"max_pages":20,"custom_domain":true,"pixel_integrations":true,"booking_engine":true,"max_team_members":3}',
  '{"Até 100 produtos","20 páginas","Motor de reservas","Domínio próprio","Pixels e Analytics","3 usuários"}'
),
(
  'Enterprise', 'premium', 600.00, 6000.00,
  '{"max_products":-1,"max_pages":-1,"custom_domain":true,"pixel_integrations":true,"booking_engine":true,"max_team_members":-1}',
  '{"Produtos ilimitados","Páginas ilimitadas","Motor de reservas avançado","Domínio próprio","Pixels e Analytics","Usuários ilimitados","Suporte prioritário"}'
)
on conflict do nothing;

-- ── Tenants ────────────────────────────────────────────────────
create table if not exists tenants (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  status                text not null default 'trial'
    check (status in ('active','inactive','suspended','trial')),
  plan_id               uuid references plans(id),
  stripe_customer_id    text unique,
  subscription_status   text check (subscription_status in ('active','trialing','past_due','canceled','unpaid')),
  stripe_subscription_id text unique,
  locale                text not null default 'pt-BR',
  trial_ends_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists tenants_slug_idx on tenants(slug);
create index if not exists tenants_status_idx on tenants(status);

-- ── Tenant Domains ─────────────────────────────────────────────
create table if not exists tenant_domains (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  domain                text not null unique,
  type                  text not null default 'subdomain' check (type in ('subdomain','custom')),
  verification_status   text not null default 'pending' check (verification_status in ('pending','verified','failed')),
  ssl_status            text not null default 'pending' check (ssl_status in ('pending','issued','failed')),
  vercel_config         jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists tenant_domains_domain_idx on tenant_domains(domain);
create index if not exists tenant_domains_tenant_id_idx on tenant_domains(tenant_id);

-- ── Users (profile, linked to Supabase Auth) ─────────────────
create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Tenant Members ─────────────────────────────────────────────
create table if not exists tenant_members (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'tenant_staff'
    check (role in ('super_admin','tenant_owner','tenant_admin','tenant_staff')),
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists tenant_members_user_id_idx on tenant_members(user_id);
create index if not exists tenant_members_tenant_id_idx on tenant_members(tenant_id);

-- ── Subscriptions ─────────────────────────────────────────────
create table if not exists subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null unique references tenants(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id    text not null,
  plan_id               uuid references plans(id),
  status                text not null,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  canceled_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Audit Logs ────────────────────────────────────────────────
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  resource    text,
  resource_id text,
  metadata    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_tenant_id_idx on audit_logs(tenant_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at before update on tenants
  for each row execute function update_updated_at();
