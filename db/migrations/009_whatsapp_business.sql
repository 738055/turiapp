-- ════════════════════════════════════════════════════════════════
-- 009 — WhatsApp Business API automatizado (Etapa 33)
-- ════════════════════════════════════════════════════════════════

-- ── Credenciais do tenant (criptografadas, mesmo padrão do Stripe/MP) ──
alter table tenant_integrations
  add column if not exists whatsapp_api_key_encrypted   text,
  add column if not exists whatsapp_phone_id_encrypted  text,
  add column if not exists whatsapp_status              text not null default 'disconnected'
    check (whatsapp_status in ('connected', 'disconnected', 'error')),
  add column if not exists whatsapp_connected_at         timestamptz;

-- ── Log de disparos (auditoria + taxa de entrega) ───────────────────────
create table if not exists whatsapp_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  phone       text not null,
  template    text not null,
  status      text not null check (status in ('sent', 'failed')),
  error       text,
  sent_at     timestamptz not null default now()
);

create index if not exists whatsapp_logs_tenant_idx on whatsapp_logs(tenant_id, sent_at desc);
