-- ════════════════════════════════════════════════════════════════
-- 013 — DB-level tamper-resistant audit trail + column-level
-- encryption guard for PII (additive hardening, nothing removed)
-- ════════════════════════════════════════════════════════════════

-- ── Private audit schema. PostgREST only exposes the `public` schema
--    by default, so this is unreachable from the REST API (anon,
--    authenticated AND service_role alike) — only direct SQL access
--    (Supabase Studio, migrations) can read or write here. This is
--    independent from and complementary to lib/audit.ts: the app-level
--    audit_logs table records *which app user* did *what action* for
--    actions the app remembered to log; this trigger-based trail
--    records *every* row UPDATE/DELETE on the listed tables even if
--    the app layer is bypassed, buggy, or a future change forgets to
--    call writeAuditLog. Note: Postgres has no SELECT trigger event,
--    so read access cannot be captured this way — only UPDATE/DELETE. ──
create schema if not exists audit;

create table if not exists audit.sensitive_data_changes (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  operation   text not null,
  row_id      uuid,
  db_role     text not null,
  old_data    jsonb,
  new_data    jsonb,
  changed_at  timestamptz not null default now()
);

create index if not exists sensitive_data_changes_table_idx
  on audit.sensitive_data_changes(table_name, changed_at desc);

create or replace function audit.log_sensitive_change()
returns trigger language plpgsql as $$
begin
  insert into audit.sensitive_data_changes (table_name, operation, row_id, db_role, old_data, new_data)
  values (
    tg_table_name,
    tg_op,
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id')::uuid else (to_jsonb(new) ->> 'id')::uuid end,
    coalesce(current_setting('role', true), 'unknown'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists customers_audit_trail on customers;
create trigger customers_audit_trail
  after update or delete on customers
  for each row execute function audit.log_sensitive_change();

drop trigger if exists bookings_audit_trail on bookings;
create trigger bookings_audit_trail
  after update or delete on bookings
  for each row execute function audit.log_sensitive_change();

drop trigger if exists tenant_payment_accounts_audit_trail on tenant_payment_accounts;
create trigger tenant_payment_accounts_audit_trail
  after update or delete on tenant_payment_accounts
  for each row execute function audit.log_sensitive_change();

drop trigger if exists leads_audit_trail on leads;
create trigger leads_audit_trail
  after update or delete on leads
  for each row execute function audit.log_sensitive_change();

drop trigger if exists quotes_audit_trail on quotes;
create trigger quotes_audit_trail
  after update or delete on quotes
  for each row execute function audit.log_sensitive_change();

-- ── customers.document (CPF/passaporte/RG) must never hold plaintext.
--    No application code reads or writes this column yet, so this is
--    safe to enforce immediately: the value must look like the
--    base64 output of lib/crypto.ts encrypt() (iv[12]+tag[16]+ciphertext,
--    base64 of at least 28 raw bytes ⇒ at least 38 base64 chars). A raw
--    CPF ("123.456.789-00") or RG would fail this check, so any future
--    code that forgets to call encrypt() before writing fails loudly
--    at the database level instead of silently storing plaintext PII. ──
alter table customers drop constraint if exists customers_document_must_be_encrypted;
alter table customers add constraint customers_document_must_be_encrypted
  check (document is null or (length(document) >= 38 and document ~ '^[A-Za-z0-9+/]+=*$'));
