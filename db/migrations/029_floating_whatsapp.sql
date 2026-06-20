-- 029 - Floating WhatsApp button settings

alter table tenant_integrations
  add column if not exists floating_whatsapp_enabled boolean not null default false,
  add column if not exists floating_whatsapp_mode text not null default 'native'
    check (floating_whatsapp_mode in ('native', 'script')),
  add column if not exists floating_whatsapp_label text,
  add column if not exists floating_whatsapp_message text,
  add column if not exists floating_whatsapp_script text;
