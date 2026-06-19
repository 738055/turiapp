-- ════════════════════════════════════════════════════════════════
-- 025 — Realtime no inbox de atendimento.
-- Habilita Supabase Realtime em conversations e messages para o painel receber
-- mensagens novas via websocket (em vez de polling), escalando melhor com muitos
-- tenants/atendentes. O Realtime respeita o RLS, então cada usuário só recebe os
-- eventos do próprio tenant. Idempotente.
-- ════════════════════════════════════════════════════════════════
do $$
begin
  alter publication supabase_realtime add table conversations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;
