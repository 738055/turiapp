// ─── Platform ────────────────────────────────────────────────────────────────

export type PlanTier = "basico" | "pro" | "premium";
export type TenantStatus = "active" | "inactive" | "suspended" | "trial";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  limits: PlanLimits;
  features: string[];
}

export interface PlanLimits {
  max_products: number;
  max_pages: number;
  custom_domain: boolean;
  pixel_integrations: boolean;
  booking_engine: boolean;
  max_team_members: number;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  plan_id: string;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  domain: string;
  type: "subdomain" | "custom";
  verification_status: "pending" | "verified" | "failed";
  ssl_status: "pending" | "issued" | "failed";
  created_at: string;
}

// ─── Users & Auth ─────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "tenant_owner"
  | "tenant_admin"
  | "tenant_staff"
  | "customer";

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

// ─── Theme / Builder ──────────────────────────────────────────────────────────

export type MenuType =
  | "top-classic"
  | "top-centered"
  | "top-transparent"
  | "sidebar";

export type CardType =
  | "card-image-large"
  | "card-horizontal"
  | "card-minimal"
  | "card-price-highlight";

export interface Theme {
  id: string;
  tenant_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  border_radius: string;
  menu_type: MenuType;
  card_type: CardType;
  logo_url: string | null;
  favicon_url: string | null;
  updated_at: string;
}

export type SectionType =
  | "hero"
  | "product-grid"
  | "product-carousel"
  | "search-bar"
  | "banner"
  | "testimonials"
  | "faq"
  | "about"
  | "contact"
  | "map"
  | "newsletter"
  | "footer";

export interface PageSection {
  id: string;
  page_id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface Page {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  status: "draft" | "published";
  is_home: boolean;
  show_in_nav: boolean;
  nav_order: number;
  sections: PageSection[];
  created_at: string;
  updated_at: string;
}

export interface NavItem {
  id: string;
  tenant_id: string;
  label: string;
  href: string;
  order: number;
  target: "_self" | "_blank";
  children?: NavItem[];
}

// ─── Tourism Catalogue ────────────────────────────────────────────────────────

export type ProductModule = "hospedagem" | "receptivo" | "emissivo";

export type ProductType =
  // hospedagem
  | "pousada"
  | "hotel"
  | "airbnb"
  | "chalé"
  | "resort"
  // receptivo
  | "ingresso"
  | "experiencia"
  | "transporte"
  | "city-tour"
  // emissivo
  | "pacote"
  | "cruzeiro"
  | "viagem";

export type SaleMode = "booking" | "whatsapp";

export interface Product {
  id: string;
  tenant_id: string;
  module: ProductModule;
  type: ProductType;
  title: string;
  slug: string;
  description: string;
  images: string[];
  status: "draft" | "published" | "archived";
  sale_mode: SaleMode;
  whatsapp_number: string | null;
  extra_data: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  rates?: ProductRate[];
}

export interface ProductRate {
  id: string;
  product_id: string;
  name: string;
  price: number;
  currency: string;
  rate_type: "per_night" | "per_person" | "per_group" | "fixed";
  valid_from: string | null;
  valid_to: string | null;
  season_name: string | null;
  occupancy_min: number;
  occupancy_max: number;
  available: boolean;
}

export interface Availability {
  id: string;
  product_id: string;
  date: string;
  available_slots: number;
  blocked: boolean;
}

// ─── Bookings & Orders ────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "refunded"
  | "completed";

export interface Booking {
  id: string;
  tenant_id: string;
  product_id: string;
  customer_id: string;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: number;
  currency: string;
  status: BookingStatus;
  payment_provider: "stripe" | "mercadopago" | null;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  /** Encrypted at rest (lib/crypto.ts encrypt/decrypt) — never read or write this as plaintext. */
  document: string | null;
  tags: string[];
  internal_notes: string | null;
  created_at: string;
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export interface TenantIntegrations {
  id: string;
  tenant_id: string;
  // SEO
  google_analytics_id: string | null;
  google_tag_manager_id: string | null;
  // Paid / Pixel
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_ads_id: string | null;
  // WhatsApp (link manual wa.me)
  whatsapp_number: string | null;
  // WhatsApp Business API (Etapa 33) — credenciais ficam só no service client
  whatsapp_status: "connected" | "disconnected" | "error";
  whatsapp_connected_at: string | null;
  // LGPD cookie consent
  cookie_consent_enabled: boolean;
  updated_at: string;
}

export interface WhatsAppLog {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  phone: string;
  template: string;
  status: "sent" | "failed";
  error: string | null;
  sent_at: string;
}

export interface TenantPaymentAccount {
  id: string;
  tenant_id: string;
  provider: "stripe" | "mercadopago";
  status: "connected" | "disconnected" | "error";
  display_name: string | null;
  connected_at: string | null;
}

// ─── CRM: Leads & Quotes ──────────────────────────────────────────────────────

export type LeadStatus =
  | "novo"
  | "cotacao_enviada"
  | "negociando"
  | "reservado"
  | "perdido";

export interface Lead {
  id: string;
  tenant_id: string;
  product_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: "site" | "manual" | "import" | "api";
  status: LeadStatus;
  assigned_to: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type QuoteStatus = "pending" | "accepted" | "declined" | "expired";

export interface Quote {
  id: string;
  tenant_id: string;
  lead_id: string;
  product_id: string;
  rate_id: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: number;
  currency: string;
  notes: string | null;
  token: string;
  status: QuoteStatus;
  decline_reason: string | null;
  expires_at: string;
  sent_at: string | null;
  responded_at: string | null;
  booking_id: string | null;
  created_at: string;
}

// ─── CRM: Automations & Notifications ──────────────────────────────────────

export interface Notification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export type TriggerType =
  | "booking_confirmed"
  | "checkin_in_days"
  | "checkout_days_ago"
  | "customer_inactive_days"
  | "lead_no_response_days"
  | "quote_expiring_soon";

export type ActionType =
  | "send_email"
  | "send_whatsapp"
  | "internal_notification"
  | "move_lead_status";

export type AutomationRunStatus = "pending" | "executed" | "failed" | "skipped";
export type AutomationEntityType = "booking" | "lead" | "quote" | "customer";

export interface Automation {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  delay_hours: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  tenant_id: string;
  entity_type: AutomationEntityType;
  entity_id: string;
  scheduled_at: string;
  executed_at: string | null;
  status: AutomationRunStatus;
  error: string | null;
  created_at: string;
}

// ─── Webhooks & API pública (Etapa 34) ─────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  tenant_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

export type WebhookDeliveryStatus = "pending" | "success" | "failed";

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  response_code: number | null;
  last_attempt_at: string | null;
  next_attempt_at: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  scope: "full" | "read_only";
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

// ─── Fidelidade (Etapa 36) ──────────────────────────────────────────────────

export type LoyaltyEarnMode = "per_amount" | "per_booking";

export interface LoyaltySettings {
  id: string;
  tenant_id: string;
  active: boolean;
  earn_mode: LoyaltyEarnMode;
  points_per_amount: number;
  points_per_booking: number;
  redeem_value_per_point: number;
  min_redeem_points: number;
  updated_at: string;
}

export type LoyaltyPointType = "earn" | "redeem";

export interface LoyaltyPoint {
  id: string;
  tenant_id: string;
  customer_id: string;
  points: number;
  type: LoyaltyPointType;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// ─── Avaliações / UGC (Etapa 23) ────────────────────────────────────────────

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  tenant_id: string;
  product_id: string;
  booking_id: string | null;
  customer_id: string | null;
  customer_name: string;
  rating: number | null;
  body: string | null;
  status: ReviewStatus;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
}

// ─── Cupons de desconto (Etapa 24) ──────────────────────────────────────────

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}
