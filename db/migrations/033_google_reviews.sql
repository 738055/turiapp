-- 033 - Google reviews integration
--
-- Stores the tenant's Google Place ID so the storefront can show live Google
-- reviews (rating + recent reviews) via the Places API. The API key itself is a
-- platform secret (GOOGLE_PLACES_API_KEY env), never per-tenant — same model as
-- the other server-side keys.
alter table tenant_integrations
  add column if not exists google_place_id text;
