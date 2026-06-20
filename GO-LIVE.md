# 🚀 TuriApp — Runbook de Go-Live

Guia passo a passo para colocar o TuriApp em produção. Siga na ordem.
Tempo estimado: **2–4 horas** (a maior parte é esperar verificação de DNS/e-mail).

> 🔐 **Os segredos já gerados** (criptografia, cron, VAPID) estão no arquivo
> `.env.production.example` (ignorado pelo git). Você só precisa colar as **chaves
> das contas** (marcadas `COLE_AQUI_...`). Este runbook **não contém segredos**.

---

## 0. Pré-requisitos — contas a criar

| Serviço | Para quê | Obrigatório? |
|---|---|---|
| [Supabase](https://supabase.com) | Banco, login, storage | 🔴 Sim |
| [Resend](https://resend.com) | E-mails (voucher, convites, cobrança) | 🔴 Sim |
| [Stripe](https://dashboard.stripe.com) | Cobrança das assinaturas dos clientes | 🔴 Sim |
| [Vercel](https://vercel.com) | Hospedagem + domínios | 🔴 Sim |
| Domínio (Registro.br, etc.) | `turiapp.com.br` (ou o seu) | 🔴 Sim |
| [Upstash](https://console.upstash.com) | Rate limit distribuído | 🟡 Recomendado |
| [Sentry](https://sentry.io) | Monitoramento de erros | 🟡 Opcional |

---

## 1. Supabase (banco)

1. Crie um projeto em supabase.com (região mais próxima do Brasil: **São Paulo**).
2. **Project Settings → API**: copie e cole no `.env.production.example`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ secreta
3. **SQL Editor** → rode, **em ordem**, todos os arquivos de `db/migrations/`:
   `001` → `002` → ... → `026`. (Pode colar um de cada vez.)
4. Rode também `db/policies/rls.sql`.
5. **Storage** → "New bucket" → nome **`media`** → marque **Public**. Ele é usado
   por imagens de produto e anexos do chat WhatsApp. (O bucket `private_docs` já
   é criado pela migration 012.)
6. Confirme no SQL Editor que o schema privado de auditoria existe:
   `select * from audit.sensitive_data_changes limit 1;` (deve responder vazio, não erro).

---

## 2. Resend (e-mails)

1. Em resend.com → **API Keys** → "Create API Key" → cole em `RESEND_API_KEY`.
2. **Domains** → "Add Domain" → `turiapp.com.br`.
3. Adicione no DNS do seu domínio os registros **DKIM, SPF e DMARC** que o Resend mostra.
4. Espere "Verified" (pode levar minutos a horas). **Sem isso, os e-mails caem em spam.**

---

## 3. Stripe (cobrança das assinaturas)  ⚠️ passo mais fácil de esquecer

1. **Developers → API keys** → copie a **Secret key** (`sk_live_...`) → `STRIPE_SECRET_KEY`.
2. **Crie os produtos/preços dos planos** (Products → Add product), um para cada plano
   (Básico, Pro, Premium), com o preço **mensal** (e anual, se for usar). Anote cada
   **Price ID** (`price_...`).
3. **🔴 ATUALIZE a tabela `plans` com os Price IDs** — sem isso o botão "Assinar"
   não funciona. No SQL Editor do Supabase:
   ```sql
   update plans set stripe_price_id_monthly = 'price_XXX' where tier = 'basico';
   update plans set stripe_price_id_monthly = 'price_YYY' where tier = 'pro';
   update plans set stripe_price_id_monthly = 'price_ZZZ' where tier = 'premium';
   -- (e stripe_price_id_yearly, se for vender plano anual)
   ```
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://app.turiapp.com.br/api/webhooks/stripe`
   - Eventos: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copie o **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

> 💡 Os pagamentos **dos clientes finais das lojas** (reservas) usam as chaves da própria
> empresa, configuradas por ela no painel — não exigem nada seu aqui.

---

## 4. Vercel (deploy)

1. Importe o repositório na Vercel (New Project).
   - ⚠️ O projeto fica na subpasta **`turiapp/`** do repo → em **Root Directory**,
     selecione **`turiapp`** (senão a Vercel não acha o `package.json`).
2. **Settings → Environment Variables** (escopo **Production**): cole **todas** as
   variáveis do `.env.production.example` já preenchidas.
   - ✅ Confira que `NEXT_PUBLIC_PLATFORM_HOST` **e** `NEXT_PUBLIC_PLATFORM_DOMAIN`
     estão com o mesmo valor (o código usa as duas).
3. **Settings → Domains** → adicione:
   - `turiapp.com.br` (site institucional/landing)
   - `*.turiapp.com.br` (lojas dos clientes por subdomínio) — **wildcard**
   - `app.turiapp.com.br` (painel dos clientes)
   - `admin.turiapp.com.br` (super admin)
4. Configure no DNS do domínio os registros que a Vercel pedir (geralmente A `@`
   → `76.76.21.21` e CNAME para os subdomínios → `cname.vercel-dns.com`).
   O **wildcard `*`** é o que faz cada loja ter `slug.turiapp.com.br`.
5. **Vercel → Settings → Tokens**: crie um token → `VERCEL_API_TOKEN`. Pegue
   `VERCEL_PROJECT_ID` (Project → Settings → General) e `VERCEL_TEAM_ID` (se for Team).
   Atualize na Vercel. (Isso liga o recurso de **domínio próprio das lojas**.)
6. **Deploy.** Os 4 cron jobs (`/api/cron/*`) já estão no `vercel.json` — a Vercel os
   ativa sozinha.

---

## 5. Primeiro super admin

1. Cadastre-se normalmente pelo site (`https://app.turiapp.com.br/cadastro`) com o seu e-mail.
2. No **SQL Editor** do Supabase, pegue seu `id` e promova:
   ```sql
   update user_profiles set is_super_admin = true
   where id = (select id from auth.users where email = 'seu@email.com');
   ```
3. Faça login → você cai em `/admin`. Na primeira vez o sistema **exige cadastrar o MFA**
   (`/mfa-enroll`) — **guarde os 10 códigos de backup** em local seguro.

---

## 6. Smoke test (validação ponta a ponta)

Marque cada item:

```
[ ] 1. Acessar https://turiapp.com.br (landing) — carrega
[ ] 2. Criar conta em app.turiapp.com.br → completar onboarding (wizard 6 passos)
[ ] 3. Loja no ar em slug.turiapp.com.br
[ ] 4. Criar um produto modo WhatsApp → no site, botão abre o WhatsApp com a info ✅
[ ] 4b. Em /conversas, responder dentro da janela de 24h com texto + imagem/audio/documento e confirmar renderização na bolha
[ ] 5. (Plano Pro/trial) Conectar Stripe ou Mercado Pago em Pagamentos
[ ] 6. Criar produto modo Reserva → fazer uma reserva de teste → pagar (sandbox) → receber voucher por e-mail
[ ] 7. Receber o e-mail de "nova reserva" como dono da loja
[ ] 8. (Opcional) Adicionar domínio próprio em Configurações → ver A+CNAME e verificação automática
[ ] 9. Assinar um plano (Stripe Checkout) → webhook marca a loja como ativa
[ ] 10. Super admin: ver MRR, clientes e audit logs em admin.turiapp.com.br
```

---

## 7. Pós-lançamento (recomendado, não bloqueia)

- **Upstash Redis**: criar DB → preencher `UPSTASH_REDIS_REST_URL/TOKEN` → rate limit
  passa a ser distribuído (proteção real contra abuso em escala).
- **Sentry**: criar projeto → `SENTRY_DSN` → erros monitorados.
- **Ícones PWA**: trocar os placeholders em `public/icons/` por arte final (`node scripts/generate-icons.mjs` gera placeholders).
- **Backups Supabase**: garantir plano com PITR (Point-in-Time Recovery) habilitado.
- **PITR/staging**: 2º projeto Supabase para homologação (testar migrations sem tocar produção).

---

## ⚠️ Erros comuns

| Sintoma | Causa provável |
|---|---|
| Botão "Assinar" dá erro | Faltou atualizar `plans.stripe_price_id_monthly` (passo 3.3) |
| E-mails não chegam / caem em spam | Domínio não verificado no Resend (DKIM/SPF) |
| Loja do cliente dá 404 | Faltou o wildcard `*.turiapp.com.br` na Vercel/DNS |
| "Bucket media não encontrado" no upload | Faltou criar o bucket `media` público (passo 1.5) |
| Assinatura não ativa a loja | Webhook do Stripe não configurado/secret errado (passo 3.4) |
| Domínio próprio da loja não verifica | Faltou `VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID` |
