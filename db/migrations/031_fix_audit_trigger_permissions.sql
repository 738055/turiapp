-- 031 - Fix audit trigger permissions without exposing the private audit schema

-- The audit schema stays private. The trigger function runs with owner
-- privileges so updates/deletes on audited tables do not fail with
-- "permission denied for schema audit" during normal app flows.
create or replace function audit.log_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, audit
as $$
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
