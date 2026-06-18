-- ════════════════════════════════════════════════════════════════
-- 002 — Builder & Theme (themes, pages, sections, navigation, media)
-- ════════════════════════════════════════════════════════════════

-- ── Themes ────────────────────────────────────────────────────
create table if not exists themes (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null unique references tenants(id) on delete cascade,
  primary_color     text not null default '#0ea5e9',
  secondary_color   text not null default '#0369a1',
  accent_color      text not null default '#f59e0b',
  background_color  text not null default '#ffffff',
  text_color        text not null default '#111827',
  font_heading      text not null default '"Inter", system-ui, sans-serif',
  font_body         text not null default '"Inter", system-ui, sans-serif',
  border_radius     text not null default '0.5rem',
  menu_type         text not null default 'top-classic'
    check (menu_type in ('top-classic','top-centered','top-transparent','sidebar')),
  card_type         text not null default 'card-image-large'
    check (card_type in ('card-image-large','card-horizontal','card-minimal','card-price-highlight')),
  logo_url          text,
  favicon_url       text,
  custom_css        text,
  updated_at        timestamptz not null default now()
);

create index if not exists themes_tenant_id_idx on themes(tenant_id);

-- ── Pages ─────────────────────────────────────────────────────
create table if not exists pages (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  slug              text not null,
  title             text not null,
  seo_title         text,
  seo_description   text,
  og_image_url      text,
  status            text not null default 'draft'
    check (status in ('draft','published')),
  is_home           boolean not null default false,
  show_in_nav       boolean not null default true,
  nav_order         integer not null default 0,
  template          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists pages_tenant_id_idx on pages(tenant_id);
create index if not exists pages_tenant_slug_idx on pages(tenant_id, slug);

-- Only one home per tenant
create unique index if not exists pages_tenant_home_idx
  on pages(tenant_id) where is_home = true;

create trigger pages_updated_at before update on pages
  for each row execute function update_updated_at();

-- ── Page Sections ─────────────────────────────────────────────
create table if not exists page_sections (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references pages(id) on delete cascade,
  type        text not null,
  "order"     integer not null default 0,
  visible     boolean not null default true,
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists page_sections_page_id_idx on page_sections(page_id);
create index if not exists page_sections_order_idx on page_sections(page_id, "order");

create trigger page_sections_updated_at before update on page_sections
  for each row execute function update_updated_at();

-- ── Navigation ────────────────────────────────────────────────
create table if not exists navigation_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  parent_id   uuid references navigation_items(id) on delete cascade,
  label       text not null,
  href        text not null,
  "order"     integer not null default 0,
  target      text not null default '_self' check (target in ('_self','_blank')),
  created_at  timestamptz not null default now()
);

create index if not exists navigation_items_tenant_id_idx on navigation_items(tenant_id);

-- ── Media Assets ──────────────────────────────────────────────
create table if not exists media_assets (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  file_name   text not null,
  storage_path text not null,
  public_url  text not null,
  mime_type   text,
  size_bytes  bigint,
  alt_text    text,
  created_at  timestamptz not null default now()
);

create index if not exists media_assets_tenant_id_idx on media_assets(tenant_id);

create trigger themes_updated_at before update on themes
  for each row execute function update_updated_at();
