-- ════════════════════════════════════════════════════════════════
-- 026 — Mídia nas mensagens do atendimento.
-- Guarda a URL pública (Supabase Storage, bucket `media`) da imagem/arquivo
-- enviado ou recebido. `body` segue como texto/legenda; `type` indica o formato
-- (image/document/audio/video/sticker).
-- ════════════════════════════════════════════════════════════════
alter table messages add column if not exists media_url text;
