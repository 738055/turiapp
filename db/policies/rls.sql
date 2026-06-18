-- ════════════════════════════════════════════════════════════════
-- Row Level Security Policies — TuriApp
-- Run after all migrations. Uses service_role to bypass RLS
-- in server-side trusted code; anon/authenticated use RLS.
-- ════════════════════════════════════════════════════════════════

-- Helper function: get the tenant_id the current user belongs to
-- (from tenant_members). Used in RLS policies.
create or replace function current_user_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id
  from tenant_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Helper: check if current user is super_admin
create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tenant_members
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- Helper: check if current user has at least a given role for their tenant
create or replace function has_tenant_role(min_role text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tenant_members
    where user_id = auth.uid()
      and role = any(
        case min_role
          when 'tenant_staff'  then array['tenant_staff','tenant_admin','tenant_owner','super_admin']
          when 'tenant_admin'  then array['tenant_admin','tenant_owner','super_admin']
          when 'tenant_owner'  then array['tenant_owner','super_admin']
          when 'super_admin'   then array['super_admin']
          else array[]::text[]
        end
      )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- PLANS (public read)
-- ─────────────────────────────────────────────────────────────
alter table plans enable row level security;
create policy "plans_public_read" on plans
  for select using (active = true);
create policy "plans_super_admin_all" on plans
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- TENANTS
-- ─────────────────────────────────────────────────────────────
alter table tenants enable row level security;
create policy "tenants_own_read" on tenants
  for select using (id = current_user_tenant_id());
create policy "tenants_own_update" on tenants
  for update using (
    id = current_user_tenant_id() and has_tenant_role('tenant_owner')
  );
create policy "tenants_super_admin_all" on tenants
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- TENANT DOMAINS
-- ─────────────────────────────────────────────────────────────
alter table tenant_domains enable row level security;
create policy "tenant_domains_own" on tenant_domains
  for all using (
    tenant_id = current_user_tenant_id() and has_tenant_role('tenant_owner')
  );
create policy "tenant_domains_super_admin" on tenant_domains
  for all using (is_super_admin());
-- Allow public read for middleware host resolution (via service_role only in code)

-- ─────────────────────────────────────────────────────────────
-- USER PROFILES
-- ─────────────────────────────────────────────────────────────
alter table user_profiles enable row level security;
create policy "user_profiles_own" on user_profiles
  for all using (id = auth.uid());
create policy "user_profiles_super_admin" on user_profiles
  for select using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- TENANT MEMBERS
-- ─────────────────────────────────────────────────────────────
alter table tenant_members enable row level security;
create policy "tenant_members_own_read" on tenant_members
  for select using (tenant_id = current_user_tenant_id());
-- "with check" is required here, not just "using": without it a
-- tenant_owner could grant role='super_admin' to their own row (or any
-- row in their tenant) and pass is_super_admin() platform-wide, since
-- that helper checks tenant_members.role with no tenant_id filter.
create policy "tenant_members_own_manage" on tenant_members
  for all using (
    tenant_id = current_user_tenant_id() and has_tenant_role('tenant_owner')
  )
  with check (
    tenant_id = current_user_tenant_id() and has_tenant_role('tenant_owner') and role <> 'super_admin'
  );
create policy "tenant_members_super_admin" on tenant_members
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
alter table subscriptions enable row level security;
create policy "subscriptions_own_read" on subscriptions
  for select using (tenant_id = current_user_tenant_id());
create policy "subscriptions_super_admin" on subscriptions
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────
alter table audit_logs enable row level security;
create policy "audit_logs_own_read" on audit_logs
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "audit_logs_super_admin" on audit_logs
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- THEMES
-- ─────────────────────────────────────────────────────────────
alter table themes enable row level security;
create policy "themes_own_manage" on themes
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "themes_public_read" on themes
  for select using (true);   -- storefront reads theme (via service_role in layout)
create policy "themes_super_admin" on themes
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- PAGES & SECTIONS
-- ─────────────────────────────────────────────────────────────
alter table pages enable row level security;
create policy "pages_own_manage" on pages
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "pages_public_read" on pages
  for select using (status = 'published');
create policy "pages_super_admin" on pages
  for all using (is_super_admin());

alter table page_sections enable row level security;
create policy "page_sections_own_manage" on page_sections
  for all using (
    exists (select 1 from pages where pages.id = page_sections.page_id
            and pages.tenant_id = current_user_tenant_id())
    and has_tenant_role('tenant_admin')
  );
create policy "page_sections_public_read" on page_sections
  for select using (
    exists (select 1 from pages where pages.id = page_sections.page_id
            and pages.status = 'published')
  );

-- ─────────────────────────────────────────────────────────────
-- NAVIGATION
-- ─────────────────────────────────────────────────────────────
alter table navigation_items enable row level security;
create policy "navigation_own_manage" on navigation_items
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "navigation_public_read" on navigation_items
  for select using (true);

-- ─────────────────────────────────────────────────────────────
-- MEDIA ASSETS
-- ─────────────────────────────────────────────────────────────
alter table media_assets enable row level security;
create policy "media_assets_own_manage" on media_assets
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "media_assets_public_read" on media_assets
  for select using (true);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
alter table products enable row level security;
create policy "products_own_manage" on products
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "products_public_read" on products
  for select using (status = 'published');
create policy "products_super_admin" on products
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- PRODUCT RATES & AVAILABILITY
-- ─────────────────────────────────────────────────────────────
alter table product_rates enable row level security;
create policy "product_rates_own_manage" on product_rates
  for all using (
    exists (select 1 from products where products.id = product_rates.product_id
            and products.tenant_id = current_user_tenant_id())
    and has_tenant_role('tenant_staff')
  );
create policy "product_rates_public_read" on product_rates
  for select using (
    exists (select 1 from products where products.id = product_rates.product_id
            and products.status = 'published')
  );

alter table availability enable row level security;
create policy "availability_own_manage" on availability
  for all using (
    exists (select 1 from products where products.id = availability.product_id
            and products.tenant_id = current_user_tenant_id())
    and has_tenant_role('tenant_staff')
  );
create policy "availability_public_read" on availability
  for select using (true);

-- ─────────────────────────────────────────────────────────────
-- CUSTOMERS (LGPD: tenant only)
-- ─────────────────────────────────────────────────────────────
alter table customers enable row level security;
create policy "customers_own_manage" on customers
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "customers_super_admin" on customers
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- BOOKINGS & ORDERS
-- ─────────────────────────────────────────────────────────────
alter table bookings enable row level security;
create policy "bookings_own_manage" on bookings
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "bookings_super_admin" on bookings
  for all using (is_super_admin());

alter table orders enable row level security;
create policy "orders_own_manage" on orders
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "orders_super_admin" on orders
  for all using (is_super_admin());

alter table order_items enable row level security;
create policy "order_items_own_manage" on order_items
  for all using (
    exists (select 1 from orders where orders.id = order_items.order_id
            and orders.tenant_id = current_user_tenant_id())
    and has_tenant_role('tenant_staff')
  );

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS & INTEGRATIONS
-- ─────────────────────────────────────────────────────────────
alter table tenant_payment_accounts enable row level security;
create policy "payment_accounts_own_manage" on tenant_payment_accounts
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_owner'));
create policy "payment_accounts_super_admin" on tenant_payment_accounts
  for select using (is_super_admin());

alter table tenant_integrations enable row level security;
create policy "integrations_own_manage" on tenant_integrations
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));

alter table tenant_onboarding enable row level security;
create policy "onboarding_own" on tenant_onboarding
  for all using (tenant_id = current_user_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- CRM: LEADS & QUOTES (Etapa 26)
-- ─────────────────────────────────────────────────────────────
alter table leads enable row level security;
create policy "leads_own_manage" on leads
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "leads_super_admin" on leads
  for all using (is_super_admin());

alter table quotes enable row level security;
create policy "quotes_own_manage" on quotes
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "quotes_public_read_by_token" on quotes
  for select using (true);  -- token is the secret; public page reads via service_role only
create policy "quotes_super_admin" on quotes
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- CRM SETTINGS (Etapa 31)
-- ─────────────────────────────────────────────────────────────
alter table crm_settings enable row level security;
create policy "crm_settings_own_manage" on crm_settings
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "crm_settings_super_admin" on crm_settings
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS & AUTOMATIONS (Etapa 32)
-- ─────────────────────────────────────────────────────────────
alter table notifications enable row level security;
create policy "notifications_own_manage" on notifications
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "notifications_super_admin" on notifications
  for all using (is_super_admin());

alter table automations enable row level security;
create policy "automations_own_manage" on automations
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "automations_super_admin" on automations
  for all using (is_super_admin());

alter table automation_runs enable row level security;
create policy "automation_runs_own_read" on automation_runs
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "automation_runs_super_admin" on automation_runs
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- WHATSAPP BUSINESS API (Etapa 33)
-- ─────────────────────────────────────────────────────────────
alter table whatsapp_logs enable row level security;
create policy "whatsapp_logs_own_read" on whatsapp_logs
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "whatsapp_logs_super_admin" on whatsapp_logs
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- WEBHOOKS DE SAÍDA & API PÚBLICA (Etapa 34)
-- ─────────────────────────────────────────────────────────────
alter table webhook_endpoints enable row level security;
create policy "webhook_endpoints_own_manage" on webhook_endpoints
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "webhook_endpoints_super_admin" on webhook_endpoints
  for all using (is_super_admin());

alter table webhook_deliveries enable row level security;
create policy "webhook_deliveries_own_read" on webhook_deliveries
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "webhook_deliveries_super_admin" on webhook_deliveries
  for all using (is_super_admin());

alter table api_keys enable row level security;
create policy "api_keys_own_manage" on api_keys
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "api_keys_super_admin" on api_keys
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- PROGRAMA DE FIDELIDADE (Etapa 36)
-- ─────────────────────────────────────────────────────────────
alter table loyalty_settings enable row level security;
create policy "loyalty_settings_own_manage" on loyalty_settings
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "loyalty_settings_super_admin" on loyalty_settings
  for all using (is_super_admin());

alter table loyalty_points enable row level security;
create policy "loyalty_points_own_read" on loyalty_points
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "loyalty_points_super_admin" on loyalty_points
  for all using (is_super_admin());

-- Códigos de login (OTP) e sessões do cliente só são lidos/escritos via
-- service_role nas rotas de API; sem RLS de tenant, apenas auditoria do super admin.
alter table loyalty_login_codes enable row level security;
create policy "loyalty_login_codes_super_admin" on loyalty_login_codes
  for all using (is_super_admin());

alter table loyalty_sessions enable row level security;
create policy "loyalty_sessions_super_admin" on loyalty_sessions
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- TEAM INVITES (Etapa 16)
-- Read-only for tenant admins (DTO never selects token_hash); all
-- writes happen via service_role API routes after their own checks.
-- Role is constrained to tenant_admin/tenant_staff at the schema level
-- (migration 015) so an invite can never mint an owner/super_admin.
-- ─────────────────────────────────────────────────────────────
alter table invites enable row level security;
create policy "invites_own_read" on invites
  for select using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "invites_super_admin" on invites
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- REVIEWS / UGC (Etapa 23)
-- Tenant staff moderate; storefront reads approved reviews via
-- service_role (no public RLS — keeps pending/rejected + token_hash hidden).
-- ─────────────────────────────────────────────────────────────
alter table reviews enable row level security;
create policy "reviews_own_manage" on reviews
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "reviews_super_admin" on reviews
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- CUPONS DE DESCONTO (Etapa 24)
-- Admin gerencia; validação/aplicação no checkout via service_role.
-- ─────────────────────────────────────────────────────────────
alter table coupons enable row level security;
create policy "coupons_own_manage" on coupons
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_admin'));
create policy "coupons_super_admin" on coupons
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- PUSH SUBSCRIPTIONS (Etapa 20 / PWA)
-- Cada usuário gerencia só as próprias inscrições; envio via service_role.
-- ─────────────────────────────────────────────────────────────
alter table push_subscriptions enable row level security;
create policy "push_subscriptions_own" on push_subscriptions
  for all using (user_id = auth.uid());
create policy "push_subscriptions_super_admin" on push_subscriptions
  for select using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- ICAL IMPORTS (Etapa 25)
-- ─────────────────────────────────────────────────────────────
alter table product_ical_imports enable row level security;
create policy "ical_imports_own_manage" on product_ical_imports
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
create policy "ical_imports_super_admin" on product_ical_imports
  for all using (is_super_admin());

-- ─────────────────────────────────────────────────────────────
-- AFILIADOS (Etapa 30)
-- Afiliado lê só o próprio; escrita e atribuição via service_role.
-- ─────────────────────────────────────────────────────────────
alter table affiliates enable row level security;
create policy "affiliates_own" on affiliates
  for select using (user_id = auth.uid());
create policy "affiliates_super_admin" on affiliates
  for all using (is_super_admin());

alter table affiliate_referrals enable row level security;
create policy "affiliate_referrals_own" on affiliate_referrals
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));
create policy "affiliate_referrals_super_admin" on affiliate_referrals
  for all using (is_super_admin());
