-- ════════════════════════════════════════════════════════════════
-- 024 — Conversation CRM: vínculo com lead, etiquetas e notas internas.
-- Complementa a Central de Atendimento (023): atribuir conversa a um lead,
-- etiquetar e registrar notas internas (visíveis só para a equipe).
-- ════════════════════════════════════════════════════════════════
alter table conversations add column if not exists lead_id uuid references leads(id) on delete set null;
alter table conversations add column if not exists tags text[] not null default '{}';

create index if not exists conversations_lead_idx on conversations(lead_id);

create table if not exists conversation_notes (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists conversation_notes_conv_idx on conversation_notes(conversation_id, created_at);

-- Funções auxiliares de RLS (idempotente).
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

alter table conversation_notes enable row level security;
drop policy if exists "conversation_notes_own_manage" on conversation_notes;
create policy "conversation_notes_own_manage" on conversation_notes
  for all using (tenant_id = current_user_tenant_id() and has_tenant_role('tenant_staff'));
drop policy if exists "conversation_notes_super_admin" on conversation_notes;
create policy "conversation_notes_super_admin" on conversation_notes
  for all using (is_super_admin());
