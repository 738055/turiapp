-- ════════════════════════════════════════════════════════════════
-- 023 — Conversations / Central de Atendimento (chat com clientes)
--
-- Inbox de mensagens bidirecional (hoje WhatsApp via 360dialog; o campo
-- `channel` deixa o modelo pronto para outros canais depois). Uma conversa por
-- telefone por canal por tenant. As mensagens (inbound/outbound) ficam em
-- `messages`, encadeadas pela conversa. `last_inbound_at` controla a janela de
-- 24h da Meta (fora dela, só template).
-- ════════════════════════════════════════════════════════════════
create table if not exists conversations (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references tenants(id) on delete cascade,
  customer_id          uuid references customers(id) on delete set null,
  channel              text not null default 'whatsapp' check (channel in ('whatsapp')),
  phone                text not null,
  contact_name         text,
  status               text not null default 'open' check (status in ('open','closed')),
  assigned_to          uuid references auth.users(id) on delete set null,
  last_message_at      timestamptz,
  last_message_preview text,
  last_inbound_at      timestamptz,
  unread_count         integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, channel, phone)
);

create index if not exists conversations_tenant_idx on conversations(tenant_id, last_message_at desc);
create index if not exists conversations_customer_idx on conversations(customer_id);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  direction       text not null check (direction in ('inbound','outbound')),
  type            text not null default 'text',
  body            text,
  wa_message_id   text,
  status          text check (status in ('sent','delivered','read','failed')),
  sender_user_id  uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages(conversation_id, created_at);
-- Dedup de mensagens recebidas (o webhook pode reentregar).
create unique index if not exists messages_wa_id_unique
  on messages(tenant_id, wa_message_id) where wa_message_id is not null;

-- Funções auxiliares de RLS (idempotente; ver migration 015 / rls.sql).
create or replace function current_user_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from tenant_members where user_id = auth.uid() limit 1;
$$;
create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from tenant_members where user_id = auth.uid() and role = 'super_admin');
$$;
create or replace function has_tenant_role(min_role text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tenant_members where user_id = auth.uid()
      and role = any(case min_role
        when 'tenant_staff' then array['tenant_staff','tenant_admin','tenant_owner','super_admin']
        when 'tenant_admin' then array['tenant_admin','tenant_owner','super_admin']
        when 'tenant_owner' then array['tenant_owner','super_admin']
        when 'super_admin'  then array['super_admin']
        else array[]::text[] end));
$$;

alter table conversations enable row level security;
drop policy if exists "conversations_own_manage" on conversations;
create policy "conversations_own_manage" on conversations
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
drop policy if exists "conversations_super_admin" on conversations;
create policy "conversations_super_admin" on conversations
  for all using (is_super_admin());

alter table messages enable row level security;
drop policy if exists "messages_own_manage" on messages;
create policy "messages_own_manage" on messages
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
drop policy if exists "messages_super_admin" on messages;
create policy "messages_super_admin" on messages
  for all using (is_super_admin());
