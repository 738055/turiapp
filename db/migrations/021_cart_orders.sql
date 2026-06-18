-- ════════════════════════════════════════════════════════════════
-- 021 — Cart / multi-product orders (Etapa 21).
--
-- A cart checkout creates ONE order plus N bookings, each booking linked back
-- via bookings.order_id. This reuses the whole per-booking machinery (vouchers,
-- loyalty, reports, CRM) for cart purchases — we only add the link and an order
-- branch in the payment webhooks. Single-product checkouts keep order_id = NULL,
-- so the existing flow is completely untouched.
-- ════════════════════════════════════════════════════════════════
alter table bookings add column if not exists order_id uuid references orders(id) on delete set null;

create index if not exists bookings_order_id_idx on bookings(order_id);

-- The orders table (migration 003) already has RLS (orders_own_manage /
-- orders_super_admin) and the customer snapshot + total_price + status columns
-- this flow needs. No change required there.
