-- ════════════════════════════════════════════════════════════════
-- 008 — CRM: Automações por Gatilho + Notificações internas (Etapa 32)
-- ════════════════════════════════════════════════════════════════

-- ── Internal notifications (ação "Criar notificação interna") ────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  title       text not null,
  message     text not null,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_tenant_idx on notifications(tenant_id, read_at);

-- ── Automations: regras configuráveis 100% via painel, por tenant ─
-- "Quando [gatilho] -> faça [ação] após [delay]". Nenhuma regra é
-- fixa no código; os presets do painel apenas pré-preenchem o
-- formulário, mas a regra ativa sempre fica salva aqui por tenant.
create table if not exists automations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  trigger_type    text not null check (trigger_type in (
                    'booking_confirmed', 'checkin_in_days', 'checkout_days_ago',
                    'customer_inactive_days', 'lead_no_response_days', 'quote_expiring_soon'
                  )),
  trigger_config  jsonb not null default '{}',
  action_type     text not null check (action_type in (
                    'send_email', 'send_whatsapp', 'internal_notification', 'move_lead_status'
                  )),
  action_config   jsonb not null default '{}',
  delay_hours     integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists automations_tenant_idx on automations(tenant_id);

create trigger automations_updated_at before update on automations
  for each row execute function update_updated_at();

-- ── Scheduling queue / execution log ──────────────────────────────
-- O worker (Etapa 32 cron) primeiro descobre entidades que casam com
-- o gatilho e insere aqui (idempotente via unique constraint), depois
-- executa as que estão com scheduled_at <= now() e status = 'pending'.
create table if not exists automation_runs (
  id              uuid primary key default gen_random_uuid(),
  automation_id   uuid not null references automations(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  entity_type     text not null check (entity_type in ('booking', 'lead', 'quote', 'customer')),
  entity_id       uuid not null,
  scheduled_at    timestamptz not null,
  executed_at     timestamptz,
  status          text not null default 'pending' check (status in ('pending', 'executed', 'failed', 'skipped')),
  error           text,
  created_at      timestamptz not null default now(),
  unique (automation_id, entity_type, entity_id)
);

create index if not exists automation_runs_pending_idx on automation_runs(status, scheduled_at);
create index if not exists automation_runs_tenant_idx on automation_runs(tenant_id);
