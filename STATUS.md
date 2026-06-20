# TuriApp — Status de Desenvolvimento

> Última atualização: 2026-06-20
> Build: ✅ Passing (`pnpm run build`) · TypeScript ✅ sem erros
> Rotas de API: 99 · Páginas: 65
> Testes: ✅ 72/72 passando (`pnpm test`)
> Migrations: 26 (`db/migrations/001` a `026`) · RLS em 100% das tabelas públicas

---

## Visão geral do sistema

TuriApp é uma plataforma SaaS white-label para negócios de turismo. Cada cliente (tenant) tem seu próprio site com identidade visual, domínio, catálogo de produtos, motor de reservas e painel de gestão — tudo isolado por RLS no Postgres. A plataforma cobra dos tenants via Stripe Subscriptions; o dinheiro das vendas vai direto para as contas Stripe/Mercado Pago dos próprios tenants.

**Stack:** Next.js 16 App Router · Supabase (Postgres + Auth + Storage + RLS) · Stripe · Mercado Pago · Resend · Vercel

**Estado atual:** núcleo de produto **essencialmente completo e revisado**. Falta apenas o **go-live** (Etapa 15: criar contas, preencher variáveis, rodar migrations, deploy) — não há mais grande funcionalidade codificável pendente. Itens conscientemente fora de escopo (exigem fornecedor pago): Channel Manager via API e Nota Fiscal eletrônica.

### 🗓️ Marcos recentes (2026-06-17 → 20)
- **Crescimento/diferenciais:** convite de membros + RBAC (16), avaliações/UGC (23), cupons (24), busca avançada (22), **carrinho multi-produto** (21), programa de afiliados (30)
- **Pagamentos:** PIX + parcelamento 12x + boleto (27), **cobrança da plataforma** com portal Stripe, dunning e carência (29)
- **Plataforma:** rate limit distribuído (Upstash), circuit breaker WhatsApp, observabilidade/Sentry, cache de storefront, índices (28); **PWA instalável + Web Push** (20); **iCal export/import** com OTAs (25)
- **Atendimento WhatsApp:** chat agora envia e renderiza mídia dentro da janela de 24h: imagem, áudio, vídeo e documentos, com `media_url` em `messages` e upload no bucket `media`
- **Gating de planos:** limites de plano (`booking_engine`/`custom_domain`/`pixel_integrations`) agora **realmente aplicados** no backend + UI de upsell — antes só contagem de produtos/usuários era enforçada (furo de monetização fechado)
- **Revisão geral + correções:** 2 bugs de constraint corrigidos (`ssl_status` e `subscription_status` — ambos travariam produção); fluxo de domínio próprio aprimorado (A+CNAME sempre, 3 estados, DNS persistido)
- **Dominios de tenant em teste:** proxy libera storefront para tenants `active` e `trial`, reescreve apenas a raiz `/` para a rota interna `/storefront` e mantém `/busca`, `/produto/...` etc no roteamento público normal; painel de domínio aceita FQDN/subdomínio `.com.br` com CNAME correto para hosts como `rotas-e-horizontes.nitromethanebrasil.com.br`
- **Storefront por modelos reais:** templates agora criam loja completa editavel (home, sobre, FAQ, contato, termos, privacidade e menu/header publico), e cards, busca e pagina de produto reutilizam os estilos dos projetos em `references/projetos-base/` (marketplace/receptivo e editorial/hospedagem), com galeria, inclusos, nao-inclusos, roteiro, politica, tarifas e placeholders visuais profissionais alimentados pelo CRUD do tenant
- **Mais modelos profissionais:** biblioteca subiu para 15 templates, organizados por tipo: Multiuso (Turismo Direto), Receptivo (Receptivo Premium, Aventura Local, Ingressos & Atrativos, Transfer Executivo), Emissivo (Agencia de Pacotes, Viagens Premium, Cruzeiros & Grupos, Excursoes Rodoviarias, Intercambio & Estudos) e Hospedagem (Hospedagem Boutique, Resort & Day Use, Chales & Natureza, Hotel Executivo, Temporada Familiar)
- **Edicao guiada para tenants:** listas do produto (destaques, inclui, nao inclui, idiomas, galeria) e roteiro agora usam adicionar/remover item; FAQ, depoimentos e estatisticas do PageBuilder tambem usam campos estruturados, sem sintaxe manual por linha. Produto em modo reserva online nao salva sem tarifa valida
- **Preview real no painel:** Aparencia usa somente iframe da loja real, e Paginas mostra a URL publica da pagina editada; quando ha dominio proprio verificado com SSL emitido, ele e preferido no preview; CSP libera destinos HTTPS em `frame-src` e limita quem pode emoldurar a loja via `frame-ancestors`
- **UX do painel tenant:** menu lateral reorganizado por contexto (Visao geral, Loja e aparencia, CRM e vendas, Canais e ajustes); PageBuilder agora separa estrutura, edicao da secao e preview instantaneo/publicado para reduzir confusao na criacao de paginas

---

## ✅ O que está implementado e funcionando

### Infraestrutura e multi-tenancy
- **26 migrations SQL** cobrindo toda a estrutura de dados: plataforma, builder, catálogo de turismo, pagamentos, integrações, CRM/leads/cotações, segmentação, automações, WhatsApp Business, webhooks/API pública, fidelidade, hardening, auditoria/PII, backup MFA, convite de membros, índices, avaliações/UGC, cupons, push, iCal, carrinho/orders, afiliados, realtime e mídia em mensagens
- **RLS (Row-Level Security)** em todas as tabelas de tenant — isolamento garantido no banco, não só no código
- **Resolução de tenant por host** (`proxy.ts`) — subdomínio (`slug.turiapp.com.br`) e domínio customizado (`www.meusite.com.br`); o tenant é sempre resolvido por uma consulta própria ao banco a partir do header `Host`, nunca por header recebido do cliente, então não é falsificável por um header forjado
- **Clientes Supabase**: browser, server (SSR), service-role (admin), middleware de sessão
- **Criptografia AES-256-GCM** para credenciais de pagamento dos tenants (`lib/crypto.ts`)
- **Rate limiting in-memory** com janela deslizante, pronto para upgrade Upstash Redis (`lib/rate-limit.ts`) — ver Etapa 28: insuficiente sozinho contra abuso distribuído em produção real
- **Audit logs** em todas as ações críticas, incluindo exportação de CSV de reservas (`lib/audit.ts`)
- **CSP completo + HSTS + `frame-ancestors` restritivo** configurados em `next.config.ts`; previews do painel usam `frame-src https:` para suportar dominios proprios dos tenants
- **54 testes automatizados** (vitest) cobrindo crypto, rate-limit, email templates, lógica de negócio e códigos de backup MFA

### Segurança — hardening de privilégio e dados (migration 012)
- **Webhooks Stripe**: assinatura verificada com `stripe.webhooks.constructEvent` (plataforma e por-tenant) — payload forjado é rejeitado antes de tocar o banco
- **Webhook Mercado Pago**: não confia no status enviado pelo payload; busca o pagamento de volta na API do MP (`getPayment`) com o token do próprio tenant e só confirma reserva se `status === "approved"`
- **Proteção contra auto-escalonamento de privilégio**: trigger de banco bloqueia qualquer alteração em `user_profiles.is_super_admin` e nas colunas de billing/status de `tenants` (`status`, `plan_id`, `stripe_customer_id`, `subscription_status`, `stripe_subscription_id`, `trial_ends_at`) feita fora do service role — sem isso, um usuário comum podia enviar um `PATCH` direto à API REST do Supabase e virar super admin ou se autopromover de plano
- **Política RLS de `tenant_members` corrigida**: um `tenant_owner` não consegue mais gravar `role = 'super_admin'` em nenhuma linha (nem na própria), o que antes destravava `is_super_admin()` — usado em ~30 políticas RLS — para qualquer tenant
- **Chaves de API com escopo** (`full` / `read_only`) — chave somente-leitura recebe 403 em qualquer rota de escrita da API pública (`lib/api-keys/auth.ts`)
- **Bucket `private_docs`** criado (privado, não público) para uso futuro com documentos sensíveis (passaporte, contrato assinado); hoje só acessível via service-role

### Segurança — auditoria em nível de banco e PII (migration 013)
- **Trilha de auditoria a prova de bypass** (`audit.sensitive_data_changes`, schema privado — não exposto pelo PostgREST, nem para `service_role`, só por acesso SQL direto/Studio): triggers em `customers`, `bookings`, `tenant_payment_accounts`, `leads`, `quotes` gravam `old`/`new` em todo `UPDATE`/`DELETE`, independente de o código da aplicação ter chamado `writeAuditLog` ou não — segunda camada, complementar ao audit log de aplicação (`lib/audit.ts`), que continua sendo a fonte de verdade para "qual usuário fez a ação" (a trigger só conhece a role de conexão, quase sempre `service_role`; Postgres não tem evento de trigger para `SELECT`, então leitura não é capturável neste nível)
- **`customers.document` (CPF/RG/passaporte) só pode conter ciphertext**: constraint de banco rejeita qualquer valor que não tenha o formato base64 produzido por `encrypt()` (`lib/crypto.ts`, AES-256-GCM) — hoje nenhuma tela ainda grava esse campo, então a constraint fecha a porta antes de existir qualquer dado em texto plano; quando o formulário de captura de documento for construído, basta usar `encrypt()`/`decrypt()` já existentes
- **Por que AES de aplicação em vez de `pgcrypto` direto no Postgres**: a app fala com o Supabase só via PostgREST (sem connection string direta), então uma chave usada por `pgcrypto` dentro de uma trigger precisaria viver dentro do próprio Postgres (`current_setting`/`ALTER DATABASE ... SET`), acessível a qualquer role conectada — estritamente mais fraco do que manter a chave só em `ENCRYPTION_KEY`, fora do banco. `pgcrypto` continua habilitado (migration 001) para uso futuro pontual em SQL puro, mas a criptografia de PII em produção usa o padrão já testado (`lib/crypto.ts`), o mesmo de `tenant_payment_accounts.encrypted_credentials`
- **DTO no painel de cliente**: `clientes/[customerId]/page.tsx` buscava `customers.*` (linha completa) — agora seleciona só as colunas usadas na tela (`id, tenant_id, name, email, phone, tags, internal_notes, created_at`), nunca a linha bruta
- **Audit log na rota de integrações** (`/api/integrations/save`): salvar pixels/scripts customizados agora grava `integrations.save` em `audit_logs`, incluindo se `head_scripts` foi alterado — antes essa rota não deixava nenhum rastro

### Rate limiting distribuído (Upstash Redis) — camada adicional (Etapa 28, parcial)
- **`enforceRateLimit()`** (`lib/rate-limit.ts`): mantém o limiter in-memory existente **e** adiciona um contador compartilhado no Upstash Redis quando `UPSTASH_REDIS_REST_URL`/`TOKEN` estão configurados. Permitido só se **ambas** as camadas permitem (o limite efetivo é o mais estrito); se o Redis estiver indisponível, faz fallback para a camada local — nunca afrouxa. Nenhuma proteção foi removida, só somada
- Aplicado nos caminhos de abuso: **login** (IP+e-mail), **checkout** (Stripe, Mercado Pago e PIX, 20/IP/10min — antes sem limite nenhum), **API pública** (por chave), **reset de senha**, **verificação de código de backup MFA**, **login de fidelidade (OTP)**
- Sem Upstash configurado, o comportamento é idêntico ao anterior (in-memory) — zero regressão

### Multi-usuário por tenant — convite de membros + RBAC (Etapa 16)
- Migration `015_team_invites.sql`: tabela `invites` com **apenas o hash SHA-256 do token** persistido (mesmo padrão de `api_keys`/`mfa_backup_codes`); `role` restrito **no schema** a `tenant_admin`/`tenant_staff` — um convite nunca consegue criar `tenant_owner` ou `super_admin`
- Página `/equipe` (`components/admin/TeamManager.tsx`): convidar por e-mail, listar membros, alterar nível, remover, ver/revogar convites pendentes — gate de vagas por plano (`max_team_members`, contando membros + convites pendentes)
- Página pública `/convite/[token]` + `AcceptInvite`: aceite **vinculado ao e-mail convidado** (o usuário logado precisa ser dono do endereço — link encaminhado não é resgatável por outra conta) e bloqueio de entrada em um 2º tenant
- Rotas: `POST /api/team/invite|invite/revoke|member/update-role|member/remove|accept`, todas com checagem de papel server-side via `lib/auth/roles.ts` (`roleAtLeast`, `assignableRoles`) — um `tenant_admin` só convida `tenant_staff`, nunca outro admin/owner
- E-mail de convite (`renderInviteEmailHtml`), suporte a `?next=` em login/cadastro (com guarda anti-open-redirect), item "Equipe" na sidebar visível só p/ admin/owner
- **Hardening RBAC adicional**: rotas que rodam como `service_role` (e portanto ignoram RLS) passaram a espelhar a policy — `pagamentos/connect` e `pagamentos/disconnect` agora são **owner-only** (igual à RLS de `tenant_payment_accounts`); `themes/update` agora exige `tenant_admin` (igual à RLS de `themes`). Sidebar também esconde "Pagamentos" (owner) e "Integrações" (admin) de quem não tem o papel

### PIX via Mercado Pago (Etapa 27, parcial)
- `createPixPayment()` (`lib/mercadopago`): pagamento PIX direto via `/v1/payments` com QR code (copia-e-cola + imagem base64), idempotência por reserva, expiração de 30min
- `POST /api/checkout/pix` (rate-limited) + `GET /api/checkout/pix/status` (polling). Confirmação reaproveita o **mesmo webhook MP** já existente (mapeado por `external_reference = bookingId`) — sem caminho de confirmação paralelo
- UI no `CheckoutWidget`: botão PIX abre painel inline com QR, botão copiar e atualização automática quando o pagamento cai

### Gráficos históricos de relatórios (Etapa 18)
- `getRevenueTrend()` (`lib/reports/data.ts`): receita + reservas confirmadas dos últimos 6 meses, uma query bucketizada
- `ReportsCharts` (server component, **sem dependência de chart lib** — barras CSS, zero JS no cliente, sem hidratação bloqueante): receita por mês, reservas por mês e top produtos por receita

### Escalabilidade e resiliência (Etapa 28, parcial)
- **Cache da camada de dados do storefront** (`lib/public-cache.ts`): produto e tema cacheados via `unstable_cache` com **chave estrita por tenant** (nunca compartilham entrada) e TTL de 120s — equivalente a ISR para páginas resolvidas por host. Página de produto agora absorve picos de leitura sem bater no banco a cada visita
- **Circuit breaker de WhatsApp** (`lib/whatsapp/circuit-breaker.ts`): limite de 200 envios/tenant/hora baseado em `whatsapp_logs` (DB, funciona distribuído entre instâncias serverless); ao estourar, pausa envios e alerta o super admin via `audit_logs` (`whatsapp.circuit_tripped`). Ligado na rota manual **e** no worker de automações — protege o número do tenant de banimento por flood
- **Observabilidade** (`lib/observability.ts`): `reportError()` loga JSON estruturado (capturável por Log Drain) e, se `SENTRY_DSN` estiver setado, encaminha para o Sentry (sem SDK pesado). Ligado no caminho de pagamento PIX e na confirmação do webhook MP
- **Índice** `bookings(tenant_id, created_at desc)` (migration 016) para dashboard, relatório mensal e gráficos de tendência (demais hot paths já indexados nas migrations 003/006/010/011)

### Avaliações / UGC (Etapa 23)
- Migration `017_reviews.sql`: tabela `reviews` (só hash do token de avaliação persistido), view `product_review_stats` (média/contagem de aprovadas por produto, `security_invoker`)
- Fluxo: reserva marcada como **concluída** → cria convite de avaliação + e-mail (`renderReviewRequestEmailHtml`) com link `/avaliar/[token]` (idempotente por `unique(booking_id)`)
- Página pública `/avaliar/[token]` (`ReviewForm`, estrelas + comentário) → `POST /api/reviews/submit` (rate-limited) → dispara evento `review.submitted` (já existia)
- Moderação em `/avaliacoes` (`ReviewModeration`, abas aguardando/aprovadas/recusadas) → `POST /api/reviews/moderate`. Só `status='approved'` aparece no site
- Exibição pública: média + estrelas no topo da página de produto e seção de depoimentos com as avaliações aprovadas (lidas via service_role — pending/rejected e token nunca saem do servidor)

### Cupons de desconto (Etapa 24)
- Migration `018_coupons.sql`: tabela `coupons` (percent/fixed, min_order, max_uses, expires_at), colunas `bookings.coupon_code`/`coupon_discount_amount`, função `consume_coupon()` (incremento atômico com recheck de `max_uses` sob lock)
- Painel `/cupons` (`CouponsManager`): criar, ativar/desativar, remover; rotas `POST /api/coupons/save|manage`
- Checkout: `CouponWidget` aplica o código via `POST /api/coupons/apply` — **um cupom por reserva** (idempotente, sem inflar contagem), aplica primeiro no booking e só então consome o uso (reverte se esgotar em corrida). Desconto reflete no resumo e no total a pagar
- Validação pura testável em `lib/coupons/validate.ts` (ativo, expirado, esgotado, pedido mínimo)

### Busca e filtros no site público (Etapa 22)
- Página `/busca` (form GET, **URL compartilhável**): busca textual em título/descrição (com sanitização anti-injeção no `.or()` do PostgREST e curinga `*` correto), filtros por módulo, preço máximo e nº de pessoas (sobre as tarifas), ordenação (relevância/menor preço/recentes)
- Resultados da busca usam `StorefrontProductCard`, o mesmo card dos modelos prontos: layout horizontal estilo marketplace para receptivo/emissivo e editorial para hospedagem, sem bloco cinza quando o tenant ainda nao cadastrou foto
- Seção `SearchBar` do builder já apontava para `/busca?q=` — agora conectada a uma página real

### Cobrança avançada da plataforma (Etapa 29)
- **Rotas que faltavam** (a página de assinatura as referenciava sem existirem): `POST /api/stripe/checkout` (assinatura nova via Stripe Checkout com cartão + trial de 14 dias **ou** troca de plano in-place com `proration_behavior: create_prorations` se já houver assinatura ativa) e `POST /api/stripe/portal` (Billing Portal do Stripe — tenant gerencia cartão/faturas/cancelamento). Ambas **owner-only**
- **Dunning com carência** no webhook da plataforma: `past_due` agora **mantém o tenant ativo** enquanto o Stripe refaz as tentativas (Smart Retries = cadência D+1/D+3/D+7), enviando e-mail de cobrança (`renderDunningEmailHtml` via `sendPlatformEmail`) a cada falha, com aviso final quando não há próxima tentativa. Só quando as tentativas se esgotam (`unpaid`/`incomplete_expired`) o tenant é suspenso (`tenantStatusFor`)
- **Sync de plano por price**: o webhook resolve `tenant.plan_id` a partir do price da assinatura (fonte de verdade), em `subscription.created/updated`
- **Hardening de constraint** (revisão geral): `tenants.subscription_status` é clampado para o conjunto permitido — Stripe emite `incomplete`/`incomplete_expired`/`paused` que violariam a constraint e fariam o UPDATE falhar; agora são mapeados para `unpaid`/`past_due`. (Mesma classe do bug de `ssl_status` corrigido no domínio próprio.)
- **Enforcement de suspensão**: a storefront de subdomínio já caía para tenant não-`active`; agora o **domínio customizado** também (proxy reforçado). Banner de cobrança no topo do painel (amarelo em carência, vermelho quando suspenso) com CTA "Regularizar pagamento"

### Parcelamento e boleto no checkout dos tenants (Etapa 27, restante)
- `createPreference` (`lib/mercadopago`) agora envia `payment_methods.installments` (até 12x) e mantém **boleto** disponível por padrão no Checkout Pro (com opção de excluir). Botão MP no `CheckoutWidget` rotulado "Cartão em até 12x ou boleto"
- Resta da Etapa 27: Stripe Connect OAuth (hoje credenciais manuais criptografadas, que funcionam)

### PWA do painel — instalável + push (Etapa 20)
- `app/manifest.ts` (manifest do painel TuriApp) + `public/sw.js` (service worker: cache do shell network-first com fallback `/offline`, eventos `push` e `notificationclick`)
- `components/pwa/PWARegister.tsx` no header: registra o SW, botão **"Instalar app"** (beforeinstallprompt) e **ativar/desativar notificações** (assina o push com a VAPID public key)
- **Web Push** (`lib/push/send.ts` com a lib `web-push` + VAPID): migration `019_push_subscriptions.sql` (RLS: cada usuário só vê as próprias inscrições), `POST/DELETE /api/push/subscribe`, e **disparo em nova reserva** para owners/admins (em `bookings/create`). Sem VAPID configurada, push vira no-op (PWA instalável continua funcionando). Ícones em `public/icons/` precisam ser adicionados no deploy

### Sincronização de calendário iCal (Etapa 25)
- Migration `020_ical.sql`: `products.ical_token` (feed secreto, default via `gen_random_bytes`) + tabela `product_ical_imports`
- **Export**: `GET /api/products/[id]/calendar.ics?token=` — feed público gated por token, com reservas confirmadas + bloqueios (só datas, nunca PII). OTAs (Airbnb/VRBO/Booking) assinam essa URL
- **Import**: `POST /api/products/ical/import` e `/sync` — busca .ics externo, parser próprio sem dependência (`lib/ical/index.ts`, testado), grava bloqueios na `availability` com nota `iCal:<label>` (re-sync substitui só as datas daquele feed, sem tocar bloqueios manuais)
- UI `IcalManager` na página de disponibilidade do produto (copiar link de export, adicionar/sincronizar/remover feeds). Cron `/api/cron/ical-sync` (6/6h) re-sincroniza tudo

### Carrinho e compra de múltiplos produtos (Etapa 21)
- Migration `021_cart_orders.sql`: coluna `bookings.order_id` (reusa `orders`/`order_items` da migration 003). **O fluxo de reserva única fica 100% intacto** (order_id null); o carrinho é um caminho paralelo aditivo
- **Carrinho client-side** (`lib/cart/store.ts`, localStorage por origem/tenant): botão "Adicionar ao carrinho" no `BookingWidget` (ao lado de "Reservar agora"), indicador flutuante `CartButton` no layout público, página `/carrinho` (`CartView`)
- **Checkout em lote** `POST /api/checkout/cart`: cria 1 `order` + N `bookings` (cada uma com `order_id`), **recalculando todos os preços no servidor** (nunca confia no total do cliente), com rate limit e rollback do order se falhar
- **Pagamento do pedido**: `/checkout/pedido/[orderId]` → `POST /api/checkout/order/stripe` (line items por booking, `metadata.order_id`) ou `/order/mercadopago` (preference multi-item, `external_reference=order_<id>`, PIX+cartão 12x+boleto, `notification_url` próprio)
- **Confirmação**: `lib/orders/confirm.ts` (compartilhado) — os webhooks Stripe-tenant (`metadata.order_id`) e MP (`external_reference` com prefixo `order_`) confirmam **todas as bookings do pedido**, enviam voucher por item e creditam fidelidade, marcando o order como `paid`. Idempotente
- Páginas de sucesso (`/checkout/pedido/sucesso`) com estado pago/pendente

### Programa de afiliados (Etapa 30)
- Migration `022_affiliates.sql`: `affiliates` (user_id, code, commission_percent) + `affiliate_referrals` (status pending/converted/paid, commission_amount), RLS (afiliado lê só o próprio)
- **Atribuição**: `?ref=CODE` capturado pelo proxy num cookie `turiapp_ref` **cross-subdomínio** (domínio `.turiapp.com.br`, 30 dias) que sobrevive landing → cadastro → onboarding; `tenants/create` lê o cookie e cria a indicação (bloqueia auto-indicação)
- **Conversão**: o webhook de cobrança da plataforma (`invoice.payment_succeeded`) converte a indicação pendente e trava a comissão = preço mensal do plano × % do afiliado (`lib/affiliates/convert.ts`)
- **Painel** `/afiliados`: virar afiliado (`POST /api/affiliates/join`, código gerado), link de indicação, cards (indicações, pagantes, a receber, já pago) e lista de conversões

### PWA — ícones gerados
- `scripts/generate-icons.mjs` gera `public/icons/icon-192/512/maskable` (PNG válido, azul TuriApp com "T") sem dependência de imagem. **São placeholders** — substituir por ícones desenhados antes do lançamento

### Itens fora de escopo por dependerem de fornecedor pago (decisão do usuário)
- **Channel Manager via API (Booking.com)** e **Nota Fiscal eletrônica (Nota.ai/Nibo)**: exigem conta/contrato pago e credenciais de terceiros — não há como integrar sem custo. Ficam para quando houver contrato. O **iCal (Etapa 25)** já cobre a sincronização de calendário com OTAs sem custo

### Checklist de segurança Next.js/Supabase/Vercel — verificação ponto a ponto
> Auditoria solicitada explicitamente: Server Actions, DTOs, middleware, criptografia de coluna, Vault, MFA, triggers de auditoria, Log Drains, pooler/TLS. Resultado linha a linha, sem otimismo:

| Item exigido | Status | Evidência / decisão |
|---|---|---|
| Server Actions com checagem de sessão | ✅ N/A | Projeto não usa `"use server"` em nenhum arquivo — toda mutação passa por `app/api/**/route.ts` com `supabase.auth.getUser()` explícito. Não há endpoint "invisível" criado por Server Action |
| DTO em Client Components (nunca objeto bruto do banco) | ✅ Corrigido | Único ponto com `select("*")` identificado e corrigido nesta rodada (`clientes/[customerId]`); demais telas auditadas já usavam select explícito |
| `middleware.ts` valida JWT antes do render | ✅ Já existia | `proxy.ts` chama `updateSession()` (`lib/supabase/middleware.ts`) que valida o JWT via `supabase.auth.getUser()` antes da página renderizar; cada layout de `(tenant-admin)` e `(super-admin)` reforça com checagem de membership/role — duas camadas |
| `pgcrypto` para campos sensíveis (CPF/documento) | ✅ Corrigido (guarda) | Ver migration 013 acima — constraint força ciphertext; ver decisão sobre `pgcrypto` vs. AES de aplicação |
| Supabase Vault para segredos de terceiros | 🟡 Decisão documentada | Credenciais de pagamento do tenant usam AES-256-GCM de aplicação (`lib/crypto.ts`), nunca em tabela em texto plano — funcionalmente equivalente ao objetivo do Vault (segredo nunca legível mesmo com dump do banco). Migrar para Vault nativo é trabalho de infraestrutura (não urgente, ver Etapa 28); decisão de adotar ou não cabe ao usuário |
| MFA (TOTP) obrigatório para super admin | ✅ Implementado (Etapa 17) | `auth.mfa` nativo do Supabase. Super admin é forçado a cadastrar TOTP (`/mfa-enroll`) e desafiado a cada login (`/mfa`) via gate em `app/(super-admin)/layout.tsx` → `requireAal2ForSuperAdmin()` (`lib/auth/super-admin.ts` + `lib/auth/mfa-gate.ts`). Recuperação por 10 códigos de backup de uso único (hash SHA-256, `mfa_backup_codes`, migration 014) + escape final via Supabase Studio. Opcional (mas enforçado se ativado) também para tenants em `/configuracoes/seguranca` |
| Triggers de banco para `SELECT`/`UPDATE`/`DELETE` | ✅ Corrigido (parcial) | `SELECT` não é capturável (Postgres não tem esse evento de trigger — nenhuma ferramenta consegue). `UPDATE`/`DELETE` agora cobertos pela migration 013 em 5 tabelas sensíveis |
| Vercel Log Drains → SIEM externo | 🔴 Pendente | Decisão de infraestrutura/fornecedor (Datadog/Splunk/CloudWatch tem custo recorrente) — não é mudança de código, fica para a fase de infraestrutura |
| Supavisor/PgBouncer com `sslmode=require` | ✅ N/A | App não abre conexão Postgres direta em nenhum lugar — só fala com Supabase via client JS (REST/PostgREST), que já é HTTPS/TLS de ponta a ponta. Connection string com pooler só seria relevante se algo conectasse via driver `pg` direto, o que não ocorre aqui |
| Nenhuma chave fora de `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `NEXT_PUBLIC_*` | ✅ Confirmado | 6 variáveis `NEXT_PUBLIC_*` existentes: URL e anon key do Supabase + 4 hosts/domínios (não-secretos). Nenhuma chave privada exposta |
| RLS em 100% das tabelas `public` | ✅ Já existia | Todas as tabelas de tenant cobertas por `db/policies/rls.sql`; tabelas só-service-role (`loyalty_login_codes`, `loyalty_sessions`) documentadas como exceção intencional |
| `service_role` fora do client/front-end | ✅ Confirmado | `createServiceClient()` só é importado em arquivos `route.ts` (server); nenhuma referência em `"use client"` ou bundle do navegador |
| Sanitização de inputs / XSS | 🟡 Risco aceito e documentado | `head_scripts` (scripts customizados por tenant) renderiza HTML/JS arbitrário via `dangerouslySetInnerHTML` sem sanitização — é uma funcionalidade intencional (pixels de terceiros exigem `<script>` inline) restrita a `tenant_owner`/`tenant_admin` e agora com audit log a cada alteração (ver acima). Comentário enganoso que dizia "sanitizado" foi corrigido no código para refletir o modelo de confiança real |
| Rate limiting + bloqueio após falhas no login | ✅ Implementado (Etapa 17) | `POST /api/auth/login` aplica rate limit composto (10/IP/15min + 5/e-mail/15min, `lib/rate-limit.ts`) com `auth.login_rate_limited`/`auth.login_failed`/`auth.login_success` em `audit_logs`; login deixou de ser uma chamada direta do browser ao SDK. Ainda in-memory por instância serverless — limite distribuído real fica para Upstash Redis (Etapa 28) |
| Backups com PITR testado | 🔴 Pendente | Decisão de plano Supabase (Etapa 28) — infraestrutura, não código |

### Auth & Onboarding
- Login (via `/api/auth/login`, rate-limited e auditado) e cadastro com Supabase Auth (email/senha)
- **Recuperação de senha** (`/recuperar-senha` → `/nova-senha`) com mensagem anti-enumeração e rate limit
- **Verificação de e-mail** pós-cadastro com reenvio (`/verificar-email`)
- **MFA/TOTP** (Etapa 17) — obrigatório para super admin, opcional (mas enforçado uma vez ativado) para tenants; 10 códigos de backup de uso único como recuperação
- Guard de onboarding: usuário já vinculado a um tenant não consegue reabrir o wizard
- **Wizard de 6 passos** com preview ao vivo das cores e do modelo de loja escolhido
- Criação automática de: tenant, tema derivado do modelo, página home com seções editáveis, nav items, primeiro produto com conteúdo rico, subdomínio e registro Stripe Customer
- Checklist de setup persistente no dashboard (passos concluídos vs. pendentes)

### Builder visual & Temas
- **ThemeEditor** — painel de Aparência atualizado com modelos profissionais de loja, preview ao vivo da loja real, upload de logo, ajuste fino de cores/fontes/menu/cards e ação para aplicar o modelo completo na home sem apagar produtos
- **PageBuilder** — fluxo em 3 areas (estrutura, formulario da secao e preview), reordenar/toggle/deletar seções, catálogo de 11 tipos de seção, edição linha-a-linha para estatísticas do hero, FAQ e depoimentos, preview instantaneo sem salvar e preview iframe da pagina publica editada
- **Modelos de Loja editáveis** (`lib/store-templates.ts`) — biblioteca nativa derivada dos projetos em `references/projetos-base/`, agora com 15 modelos separados por tipo: Multiuso, Receptivo, Emissivo e Hospedagem. Foram adicionadas as variantes Ingressos & Atrativos, Transfer Executivo, Excursoes Rodoviarias, Intercambio & Estudos, Hotel Executivo e Temporada Familiar. No onboarding e no painel Aparência o tenant escolhe um modelo, vê preview em tempo real e pode receber uma cópia editável do tema, seções e primeiro produto
- **SectionRenderer** — Hero, ProductGrid, Banner, Testimonials, FAQ, Newsletter, About, Contact, SearchBar, Map, Footer
- CSS variables aplicadas em runtime — troca de identidade visual sem rebuild
- Seções configuráveis por formulário (JSONB config por seção)
- Navegação editável (label, href, ordem)

### Catálogo de turismo — 3 módulos
- **Hospedagem** (pousada, hotel, airbnb), **Receptivo** (experiência, ingresso, transporte), **Emissivo** (pacote, cruzeiro)
- Tarifário por produto: `per_person`, `per_night`, `fixed` com sazonalidade e períodos
- Upload de até 8 imagens por produto com galeria (Supabase Storage)
- `products.extra_data` alimenta layouts profissionais com duracao/local, destaques, inclui, nao inclui, roteiro, informacoes importantes, politica de cancelamento, idiomas do guia, galeria adicional e dados de hospedagem (capacidade/quartos/banheiros); o CRUD de produtos expoe esses campos sem migration nova
- SEO por produto (title, description, OG)
- Limite de produtos por plano (Básico: 20 / Pro: 100 / Premium: ilimitado)
- **Gating de features por plano** (`lib/plans/limits.ts`): `booking_engine` (Básico = só WhatsApp, bloqueia modo "reserva" e conectar pagamento), `custom_domain` (bloqueia domínio próprio) e `pixel_integrations` (bloqueia pixels/analytics, incluindo `head_scripts`) **aplicados no backend** (products/save, payments/connect, domain/add, integrations/save); trial (sem plano) = acesso liberado; produto já em modo reserva mantém após downgrade (só novas ativações são barradas). Antes só `max_products`/`max_team_members` eram enforçados (furo de monetização fechado)
- **UI de upsell** (`components/admin/PlanGate.tsx` — `ProBadge`/`PlanLockCard`): no Básico, o card "Reserva online" do produto fica desabilitado com selo PRO; as telas de Pagamentos, Domínio próprio e Pixels mostram um cartão de bloqueio com CTA "Ver planos e fazer upgrade"
- **Calendário de disponibilidade** por produto: vagas por dia, bloqueios, notas, quick fills mensais

### Motor de reservas e checkout
- **BookingWidget público** — modo WhatsApp (link `wa.me` pré-preenchido) ou formulário inline 2 passos
- Criação de reserva com upsert de cliente, rate limiting (10/IP/10min), audit log
- **Checkout público** (`/checkout/[bookingId]`) — resumo da reserva + seleção de pagamento
- **Stripe Checkout Session** com credenciais criptografadas do tenant, URLs de retorno dinâmicas
- **Mercado Pago Preference** via HTTP direto (sem SDK), detecta sandbox por prefixo `TEST-`
- Página de sucesso pós-pagamento com estado `confirmed` ou `pending`
- **Webhooks** de Stripe e Mercado Pago confirmam reserva + enviam voucher automaticamente

### Email (Resend)
- Remetente por tenant: `noreply.{slug}@{plataforma}.com.br`
- **Voucher HTML** para o cliente após pagamento confirmado
- **Notificação de nova reserva** para todos os owners/admins do tenant (fire-and-forget)
- Templates responsivos com cor primária, logo e dados completos

### CRM — Pipeline de leads e cotações digitais (Etapa 26)
- Migration `006_crm_leads_quotes.sql`: tabelas `leads` e `quotes`
- **Kanban de leads** (`/leads`) por status: novo → cotação enviada → negociando → reservado/perdido
- Formulário público "Solicitar cotação" no site do produto → `POST /api/leads/create` (notifica tenant)
- **Cotações digitais** (`/cotacoes`, `/cotacoes/nova`) com token único, prazo de expiração e valor calculado
- **Página pública da cotação** (`/cotacao/[token]`) — aceitar (cria booking + vai ao checkout) ou recusar com motivo
- `POST /api/quotes/send` envia o link por email; `POST /api/quotes/respond` processa aceite/recusa

### CRM — Score, segmentação e histórico 360° (Etapa 31)
- Migration `007_crm_segmentation.sql`: `customers.tags[]`, `customers.internal_notes`, tabela `crm_settings`
- **Faixas de score/segmentação configuráveis por tenant via painel** (`/configuracoes/crm`) — nada hardcoded: cada tenant define seus próprios limiares de Prata/Ouro/VIP, dias de risco/perdido/novo (`lib/crm/segmentation.ts`)
- Badges automáticos na lista e perfil do cliente (VIP, Fiel, Em risco, Perdido, Novo)
- Tags manuais livres e busca/filtro por tag e segmento em `/clientes`
- Histórico 360° em `/clientes/[customerId]`: timeline de reservas, cotações, leads e notas internas

### Automações por gatilho (Etapa 32)
- Migration `008_automations.sql`: tabelas `automations`, `automation_runs`, `notifications`
- Painel `/automacoes`, `/automacoes/nova`, `/automacoes/[automationId]` — regras 100% configuráveis pelo tenant (gatilho → delay → ação), presets apenas pré-preenchem o formulário (`lib/automations/templates.ts`, `lib/automations/render.ts`)
- Gatilhos: reserva confirmada, check-in em X dias, check-out há X dias, cliente inativo há X dias, lead sem resposta, cotação expirando
- Ações: enviar email, enviar WhatsApp, notificação interna, mover lead de status
- Worker `GET /api/cron/automations` (Vercel Cron) processa a fila `automation_runs` com idempotência (`unique(automation_id, entity_type, entity_id)`)
- Sino de notificações internas no painel (`/notificacoes`, `/api/notifications/list`, `/api/notifications/mark-read`)

### Central de Atendimento — chat WhatsApp bidirecional (CRM)
- Migration `023_conversations.sql`: `conversations` (thread por telefone/cliente, `last_inbound_at` p/ janela 24h, `unread_count`) + `messages` (inbound/outbound, dedup por `wa_message_id`). RLS staff
- Migration `026_message_media.sql`: adiciona `messages.media_url` para anexos enviados/recebidos (`image`, `document`, `audio`, `video`, `sticker`)
- **Webhook de entrada** `/api/webhooks/whatsapp?tenant=<slug>`: recebe mensagens do 360dialog (formato WhatsApp Cloud), cria/atualiza conversa, vincula cliente por telefone, baixa mídia recebida e re-hospeda no bucket público `media`, grava mensagem (`lib/conversations/store.ts`)
- **API**: `conversations/list`, `/messages` (marca lida + traz reservas do cliente vinculado), `/send` — **texto livre e mídia dentro da janela de 24h da Meta, template aprovado fora dela**, com circuit breaker; `sendWhatsAppText`, `sendWhatsAppMedia` e templates no 360dialog
- **UI** `/conversas` (`ChatInbox`): lista de conversas + thread estilo chat + caixa de resposta com anexo + renderização de imagem/áudio/vídeo/documento na bolha + contexto do cliente (reservas), com polling/realtime. Item "Atendimento" na sidebar. A URL do webhook é exibida na tela de WhatsApp para o tenant colar no 360dialog
- **CRM no chat** (migration `024`): atribuir conversa a um atendente da equipe, status aberta/resolvida, etiquetas (`tags`), notas internas (`conversation_notes`), e **virar cliente/criar lead** direto da conversa (`/api/conversations/update|note|convert`). Filtros (Todas/Abertas/Resolvidas/Minhas). **Card do lead no kanban tem "Abrir conversa"** (linka por `lead_id` ou telefone) e a conversa abre direto via `/conversas?c=<id>`

### WhatsApp Business API (Etapa 33)
- Migration `009_whatsapp_business.sql`: credenciais criptografadas em `tenant_integrations`, tabela `whatsapp_logs`
- Conexão via 360dialog configurada **pelo tenant no painel** (`/whatsapp`) — `api_key`/`phone_id` próprios, nunca hardcoded na plataforma (`lib/whatsapp/360dialog.ts`)
- `POST /api/integrations/whatsapp/validate` testa as credenciais antes de salvar; `POST /api/integrations/whatsapp/disconnect` revoga
- `POST /api/whatsapp/send` dispara mensagens de template (`lib/whatsapp/templates.ts`), integrado como ação do motor de automações
- Log de disparos com status de entrega por tenant

### Webhooks de saída e API pública (Etapa 34)
- Migration `010_webhooks_api.sql`: `webhook_endpoints`, `webhook_deliveries`, `api_keys`
- Painel `/integracoes/webhooks` — cadastrar URLs por tenant, escolher eventos, ver histórico de entregas e reenviar manualmente
- Disparo assinado com HMAC-SHA256 (`lib/webhooks/dispatch.ts`, `lib/webhooks/events.ts`) e retry com backoff exponencial via `GET /api/cron/webhooks-retry`
- Eventos: `customer.created`, `booking.created/confirmed/cancelled/completed`, `lead.created`, `quote.accepted`, `review.submitted`
- **API pública REST** (`/integracoes/api`) — gerar/revogar chaves (só o hash é persistido, `lib/api-keys/auth.ts`), documentação inline em `GET /api/public/docs`
- Endpoints: `GET/POST /api/public/bookings`, `GET /api/public/products`, `GET /api/public/customers`, autenticados via `Authorization: Bearer`

### Relatórios PDF white-label (Etapa 35)
- `GET /api/reports/monthly.pdf` — PDF com capa (logo/cores do tenant), resumo executivo, tabela de reservas do período e top produtos por receita (`lib/reports/data.ts`)
- `GET /api/reports/product/[id]` — relatório de performance por produto individual
- Botão "Exportar relatório PDF" na página `/relatorios`
- `GET /api/cron/monthly-report` — envio automático por email todo início de mês

### Programa de fidelidade (Etapa 36)
- Migration `011_loyalty.sql`: `loyalty_settings`, `loyalty_points` (ledger), `loyalty_login_codes`, `loyalty_sessions`, colunas `bookings.loyalty_points_redeemed`/`loyalty_discount_amount`
- Regras de pontuação **100% configuráveis pelo tenant no painel** (`/fidelidade`) — modo "por valor gasto" ou "fixo por reserva", valor de resgate por ponto e mínimo para resgatar (`lib/loyalty/settings.ts`)
- Pontos creditados automaticamente na confirmação da reserva (webhooks Stripe/MP e ação manual "confirmar"), com idempotência e e-mail "você ganhou N pontos" (`lib/loyalty/earn.ts`)
- **Login do cliente sem senha** (OTP de 6 dígitos por email, expira em 10min, máx. 5 tentativas) — só hash é persistido, nunca o código em texto plano (`lib/loyalty/auth.ts`)
- Widget de resgate no checkout (`LoyaltyRedeemWidget`) aplica o desconto direto no `total_price` da reserva antes do pagamento
- Página pública da conta do cliente `/minha-fidelidade` — saldo, extrato completo, logout
- Painel do tenant: regras + ranking de clientes por pontos (`getLoyaltyRanking`)
- Todas as tabelas com RLS; `loyalty_login_codes`/`loyalty_sessions` sem policy de tenant (só acessadas via `service_role` nas rotas de API)

### Painel do tenant
- **Dashboard** — receita do mês, ticket médio, taxa de confirmação, reservas recentes, checklist de setup
- **Produtos** — listagem, criar, editar, disponibilidade por calendário
- **Reservas** — lista com filtro por status, detalhe, ações (confirmar/cancelar/concluir/reenviar voucher), **exportar CSV** (compatível com Excel)
- **Clientes** — busca, perfil 360°, score/tags/segmentação, histórico, ações LGPD (exportar dados / anonimizar e excluir)
- **Leads e cotações** — kanban de pipeline, cotações digitais com link público e expiração
- **Automações** — regras de gatilho→ação configuráveis, fila de execução, notificações internas
- **Relatórios** — cards de desempenho do mês + exportação de PDF white-label
- **Fidelidade** — regras de pontuação/resgate e ranking de clientes
- **Páginas** — criar e editar com PageBuilder
- **Temas** — ThemeEditor com modelos profissionais, preview ao vivo e aplicacao de template na home
- **Pagamentos** — conectar/desconectar Stripe e Mercado Pago (credenciais criptografadas)
- **Integrações** — GA4, GTM, Meta Pixel, TikTok Pixel, WhatsApp Business API, webhooks de saída, API pública, scripts customizados
- **Equipe** — convidar membros por e-mail, definir papel (admin/atendimento), revogar convites, remover membros (Etapa 16)
- **Cupons** — códigos de desconto (percentual/fixo) aplicados no checkout (Etapa 24)
- **Avaliações** — fila de moderação das avaliações dos clientes (Etapa 23)
- **Configurações** — dados da empresa, locale, assinatura/upgrade de plano, regras de CRM (faixas de score)
- **Domínio próprio** — adicionar/remover self-service com SSL automático via Vercel; instruções DNS mostram **A (raiz) e CNAME (www) sempre** com aviso "use o que seu provedor permitir"; registros DNS persistidos (`vercel_config`) e re-exibidos no reload; verificação automática (30s) com **3 estados**: Aguardando DNS → Emitindo SSL → Verificado e seguro. (Corrigido bug: `ssl_status` gravava `'active'`, valor fora da constraint do banco `('pending','issued','failed')` — fazia a verificação falhar e o domínio nunca subir)

### SEO & LGPD
- `sitemap.xml` e `robots.txt` dinâmicos por tenant
- Banner de consentimento de cookies (localStorage, evento `cookieConsentAccepted`)
- Scripts de pixel só injetados após consentimento (`strategy="afterInteractive"`)
- Export de dados do titular (LGPD Art. 18) e anonimização/exclusão

### Super Admin
- Painel isolado (`admin.*`) com gate `is_super_admin` em `user_profiles`
- Dashboard de MRR, tenants ativos, reservas globais
- Gestão de tenants (ativar/suspender), assinaturas, audit logs (últimas 100 entradas)
- Editor de planos (nome, preço, Stripe Price ID, limites JSON)
- Gestão de domínios custom via Vercel API

### Site público do tenant
- Renderização SSR por tenant, temável por CSS variables
- Galeria de imagens, tabela de tarifas, BookingWidget
- Página 404 personalizada com logo e cor do tenant
- Banner LGPD + scripts de analytics integrados ao layout

---

## 🔴 O que falta para um SaaS completo e imponente

As próximas etapas estão ordenadas por impacto real no produto. As primeiras são pré-requisito para ter clientes reais; as últimas são diferenciais competitivos.

---

### Etapa 15 — Deploy e configuração de produção
**Impacto: desbloqueador absoluto — sem isso não existe produto**

> 📘 **Runbook pronto: `GO-LIVE.md`** (passo a passo completo) + `.env.production.example`
> (variáveis com os segredos já gerados; ignorado pelo git). Comece por ali.

- [ ] Criar projeto Supabase (produção) e rodar as 26 migrations + `rls.sql`
- [ ] Criar bucket `media` no Supabase Storage como público (`private_docs` já é criado pela migration 012)
- [ ] Executar também `db/migrations/013_audit_trail_and_pii.sql` (schema `audit` privado + constraint de `customers.document`)
- [ ] Executar também `db/migrations/014_mfa_backup_codes.sql` (tabela `mfa_backup_codes` para recuperação de MFA)
- [ ] Configurar domínio na Vercel (`*.turiapp.com.br` + `app.turiapp.com.br` + `admin.turiapp.com.br`)
- [ ] Verificar domínio de email no Resend (DKIM/SPF para `turiapp.com.br`)
- [ ] Configurar variáveis de ambiente na Vercel (ver seção "Variáveis" abaixo)
- [ ] Configurar endpoint de webhook Stripe para `/api/webhooks/stripe`
- [ ] Configurar endpoint de webhook Stripe-tenant por tenant com header `x-tenant-slug`
- [ ] Setar `is_super_admin = true` no primeiro usuário via Supabase Studio
- [ ] Smoke test completo: cadastro → onboarding → produto → reserva → pagamento → voucher

---

### Etapa 16 — Multi-usuário por tenant (convidar membros) ✅ Concluída
**Impacto: alto — agências têm equipes; falta sem isso para negócios médios**

- [x] Página `/equipe` no painel do tenant: lista membros com roles e status (`TeamManager`)
- [x] Fluxo de convite: input de email → gera token (só hash persistido) → envia email via Resend
- [x] Página pública `/convite/[token]` — aceitar convite (vinculado ao e-mail) e criar conta (ou login)
- [x] Migration `015_team_invites.sql` (`invites`: email, tenant_id, role, token_hash, expires_at, accepted_at, revoked_at)
- [x] Gestão: alterar role (owner), revogar convite/acesso, remover membro
- [x] Gate de limite de membros por plano (`max_team_members`, conta membros + convites pendentes)
- [x] **Matriz de RBAC**: `role` de convite restrito a admin/staff no schema; rotas `service_role` alinhadas à RLS (pagamentos = owner-only, themes = admin); `lib/auth/roles.ts` centraliza a hierarquia; sidebar esconde itens por papel. As policies RLS já gateavam `tenant_payment_accounts` (owner) e `tenant_integrations` (admin) — o gap real era nas rotas service_role, agora fechado

---

### Etapa 17 — Recuperação de senha e segurança de auth ✅ Concluída
**Impacto: alto — obrigatório para qualquer produto em produção**

- [x] Página `/recuperar-senha` (`POST /api/auth/reset-request` → `supabase.auth.resetPasswordForEmail`) — **retorna sempre a mesma mensagem genérica**, independente de o email existir ou não, para não permitir enumeração da base de usuários; rate limit 5/IP/15min; audit log `auth.reset_request`
- [x] Página `/nova-senha` (escuta `onAuthStateChange` `PASSWORD_RECOVERY` + `getSession()`; `supabase.auth.updateUser({ password })`, mín. 8 caracteres)
- [x] Página `/verificar-email` (aviso pós-cadastro com reenvio via `supabase.auth.resend`); `cadastro/page.tsx` redireciona para cá quando não há sessão imediata
- [x] Proteção de onboarding: `app/onboarding/layout.tsx` redireciona para `/dashboard` se o usuário já tem linha em `tenant_members`
- [x] Logout com limpeza de sessão e redirect para `/login` — paridade entre tenant-admin (já existia) e super-admin (`components/admin/SuperAdminLogout.tsx`, novo)
- [x] Rate limit na rota de login — `POST /api/auth/login` (composto IP + e-mail, ver checklist de segurança acima), substituindo a chamada direta do browser ao SDK
- [x] **MFA (2FA)** — obrigatório para super admin (`/mfa-enroll`, `/mfa`, gate em `(super-admin)/layout.tsx`); opcional mas enforçado uma vez ativado para tenants (`/configuracoes/seguranca`, gate em `(tenant-admin)/layout.tsx`). TOTP via `auth.mfa` nativo do Supabase + 10 códigos de backup de uso único (hash SHA-256, migration 014) para recuperação, com escape final via Supabase Studio

---

### Etapa 18 — Relatórios e analytics do tenant (parcial)
**Impacto: alto — diferencial de retenção; tenants precisam saber se o negócio está crescendo**

- [x] Página `/relatorios` com cards de receita do mês, reservas confirmadas, novos clientes, ticket médio
- [x] Exportação em PDF (ver Etapa 35, já entregue)
- [x] Gráficos visuais: receita por mês (barras), reservas por mês, top produtos por receita (`ReportsCharts`, sem dependência de chart lib)
- [ ] Pizza/rosca por origem WhatsApp vs. online (requer contador de origem)
- [ ] Métricas de funil: visitas à página do produto → booking criado → pago
  - Requer contador de visitas em `products` (ou integração GA4)
- [ ] Filtros por período (este mês / últimos 3 meses / personalizado)
- [ ] Biblioteca de gráficos: `recharts` ou `chart.js` (leve, sem SSR bloqueante)

---

### Etapa 19 — Notificações in-app e centro de notificações (parcial)
**Impacto: médio-alto — mantém o tenant engajado sem depender só de email**

- [x] Tabela `notifications` (criada na migration 008, junto com automações)
- [x] Página `/notificacoes` + `GET /api/notifications/list` + `POST /api/notifications/mark-read`
- [x] Geração de notificações pela ação "notificação interna" do motor de automações (Etapa 32)
- [x] Sino de notificações no header do painel com badge de não-lidas (`NotificationBell`, já no `AdminHeader`)
- [x] Botão "marcar todas como lidas"
- [ ] Geração direta a partir de eventos que não passam por automação (nova reserva, domínio verificado, assinatura vencendo)

---

### Etapa 20 — PWA e app mobile (Progressive Web App) ✅ (núcleo)
**Impacto: médio — tenants no celular conseguem gerenciar reservas de qualquer lugar**

- [x] `manifest.ts` do painel (nome, ícones, tema)
- [x] Service Worker para cache offline das páginas do painel (`public/sw.js`)
- [x] Ícone "Instalar app" no header do painel (beforeinstallprompt)
- [x] Push notifications via Web Push API (nova reserva chega como notificação nativa) — tabela `push_subscriptions` + `lib/push/send.ts`
- [ ] Adicionar os PNGs de ícone em `public/icons/` (192/512/maskable) e revisar layout mobile-first página a página

---

### Etapa 21 — Carrinho e compra de múltiplos produtos (módulo Emissivo) ✅ Concluída
**Impacto: médio — pacotes e cruzeiros precisam de carrinho; booking único não é suficiente**

- [x] Carrinho client-side em localStorage (`lib/cart/store.ts`) — dispensa tabela `carts`/TTL/cron de limpeza
- [x] Add-to-cart no `BookingWidget` + indicador flutuante `CartButton` + página `/carrinho` (`CartView`)
- [x] `/api/checkout/cart` — cria order + N bookings (preços recalculados no servidor)
- [x] Pagamento em lote Stripe (line items) e MP (preference multi-item, PIX/cartão/boleto); confirmação por `lib/orders/confirm.ts` nos webhooks
- [x] Order keyed por `bookings.order_id` reusando voucher/fidelidade/relatórios por booking

---

### Etapa 22 — Busca e filtros avançados no site público ✅ Concluída
**Impacto: médio — site público atual lista produtos sem filtragem; prejudica conversão**

- [x] Página `/busca` pública com filtro por módulo, faixa de preço (máx.), número de pessoas e ordenação (relevância/menor preço/recentes)
- [x] Busca textual no título e descrição (ilike sanitizado; migrar para `tsvector`+GIN fica para catálogos muito grandes)
- [x] Seção `SearchBar` do builder conectada à `/busca`
- [x] URL compartilhável com query params (`/busca?modulo=receptivo&preco_max=500&pessoas=2`)
- [ ] Filtro por data (disponibilidade integrada à `availability`) — pendente

---

### Etapa 23 — Avaliações e depoimentos (UGC) ✅ Concluída
**Impacto: médio — prova social aumenta conversão; especialmente importante em turismo**

- [x] Tabela `reviews` (migration 017; só hash do token persistido) + view `product_review_stats`
- [x] Email pós-conclusão da reserva pedindo avaliação (link único com token)
- [x] Página pública de avaliação: `/avaliar/[token]` (formulário simples, sem login)
- [x] Aprovação pelo tenant no painel: `/avaliacoes` com fila de moderação
- [x] Exibição no site público: estrelas/média no topo do produto e seção de depoimentos aprovados
- [ ] Estrelas no card da grade/listagem (view pronta; falta plugar nos cards) e SEO de rating

---

### Etapa 24 — Cupons de desconto e promoções ✅ Concluída
**Impacto: médio — ferramenta de crescimento e retenção usada por todo e-commerce de turismo**

- [x] Tabela `coupons` (migration 018) + função `consume_coupon()` atômica + colunas no booking
- [x] Página `/cupons` no painel: criar, listar, ativar/desativar, remover
- [x] Campo de cupom no checkout público (`CouponWidget` em `/checkout/[bookingId]`)
- [x] `/api/coupons/apply` — valida (`lib/coupons/validate.ts`) e aplica o desconto no total da reserva
- [x] Desconto aplicado reduzindo o `total_price` da reserva antes do pagamento (Stripe/MP/PIX usam o total já com desconto)
- [ ] Relatório de uso por código (contagem `uses_count` já existe; falta a tela dedicada)

---

### Etapa 25 — Integração com canais de distribuição (OTAs) 🟡 (iCal entregue)
**Impacto: médio — diferencial competitivo forte para hospedagem**

- [x] **iCal export/import**: `.ics` por produto (gated por token), import de `.ics` externo bloqueando datas na `availability`, re-sync via cron 6/6h
- [ ] **Channel Manager via API** (Booking.com Content/Availability API) — 2-way sync mais profundo que iCal
- [ ] **Push de saída para OTAs**: iCal é pull (a OTA busca o feed). Push em tempo real exige a API de cada canal

---

### Etapa 27 — Pagamentos avançados (PIX e Stripe Connect OAuth)
**Impacto: médio — PIX é obrigatório no Brasil; OAuth é mais seguro que chaves manuais**

- [x] **PIX via Mercado Pago**: checkout com QR code e polling de confirmação ✅
  - `POST /api/checkout/pix` — gera QR code (copia-e-cola + base64) via `/v1/payments`
  - Polling a cada 4s via `GET /api/checkout/pix/status`; confirmação pelo webhook MP existente (`external_reference`)
- [ ] **Stripe Connect Standard** (em vez de chaves manuais) — OAuth flow mais seguro:
  - `/api/payments/stripe-connect/start` — redirect para OAuth Stripe
  - `/api/payments/stripe-connect/callback` — troca code por access_token
- [x] **Parcelamento** no Mercado Pago (`payment_methods.installments` até 12x na preference)
- [x] **Boleto** via MP disponível por padrão no Checkout Pro (para produtos de alto valor)

---

### Etapa 28 — Escalabilidade e performance de produção
**Impacto: alto quando tiver tráfego real**

- [x] **Upstash Redis** para rate limiting distribuído — `enforceRateLimit()` adiciona o contador Redis por cima do in-memory (login, checkout, API pública, reset, OTP). Sem remover camadas. Falta ainda: cache de tenant config em Redis
- [x] **Cache da camada de dados** para a página pública de produto (`lib/public-cache.ts`, `unstable_cache` por tenant, TTL 120s) — equivalente a ISR para páginas resolvidas por host (full ISR estático não se aplica pois o tenant vem do header `Host`)
- [ ] **Edge Middleware** para resolução de tenant (mais rápido que serverless)
- [ ] **CDN de imagens**: `next/image` com `domains` apontando para Supabase Storage CDN
- [x] **Índices Postgres**: `products(status,tenant_id)` e `availability(product_id,date)` já existiam (migration 003); adicionado `bookings(tenant_id, created_at desc)` na migration 016 para dashboard/relatórios/tendência
- [ ] **Connection pooling** via PgBouncer (Supabase já oferece — habilitar modo `transaction`)
- [x] **Monitoramento de erros**: `lib/observability.ts` (`reportError`) loga JSON estruturado e encaminha ao Sentry se `SENTRY_DSN` setado (sem SDK pesado), ligado no caminho de pagamento PIX e na confirmação do webhook MP. Falta ainda: Vercel Analytics (performance) e configurar o projeto Sentry/Log Drain externo (infraestrutura)
- [ ] **"Load balancer"**: não se aplica como item separado — a Vercel já balanceia/escala funções serverless automaticamente por região. O que substitui o conceito aqui é garantir que nada no código dependa de estado em memória entre requisições (ver Upstash acima) e que o Supabase esteja no plano com pooling adequado à carga
- [ ] **Ambiente de homologação**: 2º projeto Supabase (staging) + Vercel Preview Deployments apontando para ele, com variáveis de ambiente próprias — permite testar migrations e features novas sem tocar dados reais de tenant. Tem custo recorrente (plano Supabase adicional)
- [ ] **Backups**: confirmar plano Supabase com PITR (Point-in-Time Recovery) habilitado — no plano Free os backups são limitados; produção real exige Pro ou superior
- [x] **Circuit breaker no worker de WhatsApp**: `lib/whatsapp/circuit-breaker.ts` — limite de 200 envios/tenant/hora (baseado em `whatsapp_logs`, funciona distribuído); ao estourar pausa os envios e alerta o super admin via `audit_logs` (`whatsapp.circuit_tripped`). Ligado na rota manual e no worker de automações
- [ ] **Criptografia a nível de coluna (`pgcrypto`)** para campos muito sensíveis do CRM (`leads`/`customers`: documentos, notas internas) — hoje protegidos só por RLS; criptografar em repouso é uma camada extra para dado de PII em massa

---

### Etapa 29 — Cobrança avançada e financeiro da plataforma ✅ (núcleo)
**Impacto: alto — garante a receita recorrente e reduz churn involuntário**

- [x] **Trial com cartão**: Stripe Checkout em modo subscription coleta o cartão e inicia o trial de 14 dias (`/api/stripe/checkout`)
- [x] **Dunning automático**: e-mail de cobrança a cada falha de fatura (cadência D+1/D+3/D+7 das Smart Retries do Stripe), com aviso final
- [x] **Portal do cliente Stripe** (`/api/stripe/portal`) — tenant gerencia cartão, faturas e cancela sozinho
- [x] **Upgrades/downgrades com prorate**: `stripe.subscriptions.update` com `proration_behavior: 'create_prorations'`
- [x] **Período de carência**: `past_due` mantém o tenant ativo durante as tentativas do Stripe; suspende só quando esgotam (`unpaid`)
- [ ] **Fatura/NF-e**: integração com **Nota.ai** ou **Nibo** para emissão automática de NF-e após pagamento (pendente — fornecedor externo)

---

### Etapa 30 — Programa de afiliados e indicação ✅ Concluída
**Impacto: médio — crescimento viral sem custo de aquisição**

- [x] Tabela `affiliates` + `affiliate_referrals` (migration 022)
- [x] Rastreamento de origem: `?ref=CODIGO` → cookie cross-subdomínio de 30 dias (proxy)
- [x] Atribuição: tenant criado vindo do link gera indicação; conversão + comissão no webhook de cobrança
- [x] Painel do afiliado `/afiliados`: link, conversões, comissões pendentes/pagas
- [ ] Pagamento de comissão (payout) — hoje manual via status `paid`; automação via Stripe/PIX fica para depois

---

## 💰 Estrutura de pricing sugerida com os novos módulos

| Recurso | Básico R$97 | Pro R$297 | Premium R$597 | Enterprise R$1.200 |
|---|:---:|:---:|:---:|:---:|
| Produtos | 20 | 100 | Ilimitado | Ilimitado |
| Páginas do site | 5 | 20 | Ilimitado | Ilimitado |
| Motor de reservas online | ✅ | ✅ | ✅ | ✅ |
| Stripe + Mercado Pago | ✅ | ✅ | ✅ | ✅ |
| PIX | — | ✅ | ✅ | ✅ |
| Domínio próprio | — | ✅ | ✅ | ✅ |
| Pixels / Analytics | — | ✅ | ✅ | ✅ |
| Usuários da equipe | 1 | 3 | 10 | Ilimitado |
| **Pipeline de leads** | — | ✅ | ✅ | ✅ |
| **Cotações digitais** | — | ✅ | ✅ | ✅ |
| **Score e segmentação** | — | ✅ | ✅ | ✅ |
| **Histórico 360° do cliente** | — | ✅ | ✅ | ✅ |
| **Relatórios PDF** | — | ✅ | ✅ | ✅ |
| **Cupons de desconto** | — | ✅ | ✅ | ✅ |
| **Automações por gatilho** | — | — | ✅ | ✅ |
| **WhatsApp Business API** | — | — | ✅ | ✅ |
| **Webhooks de saída** | — | — | ✅ | ✅ |
| **API pública REST** | — | — | ✅ | ✅ |
| **Programa de fidelidade** | — | — | ✅ | ✅ |
| **iCal / OTA sync** | — | — | — | ✅ |
| **Multi-marcas** | — | — | — | ✅ |
| **Permissões granulares** | — | — | — | ✅ |
| Suporte | Email | Email | Prioritário | Dedicado |

---

## 📊 Resumo de maturidade por dimensão

| Dimensão | Status | Observação |
|---|---|---|
| Multi-tenancy e isolamento | ✅ Completo | RLS + proxy de host + domínio custom |
| Segurança (escalonamento de privilégio) | ✅ Completo | Migration 012 — self-escalation de `is_super_admin` e `tenant_members.role` bloqueado no banco |
| Segurança (auditoria de banco + PII) | ✅ 100% do núcleo | Migration 013 — triggers UPDATE/DELETE em 5 tabelas sensíveis + ciphertext obrigatório em `customers.document`. MFA implementado (Etapa 17). Falta só Log Drains externos (Etapa 28, infraestrutura) |
| Auth e onboarding | ✅ 100% | Recuperação de senha, verificação de e-mail, rate limit (distribuído) no login, guard de onboarding, MFA (Etapa 17) e convite de membros + RBAC (Etapa 16) implementados |
| Builder visual | ✅ Completo | 11 tipos de seção, preview ao vivo |
| Catálogo de turismo | ✅ Completo | 3 módulos, tarifário, disponibilidade |
| Motor de reservas | ✅ Completo | WhatsApp + booking online |
| Checkout e pagamentos | ✅ Completo | Stripe + MP + **PIX** (QR code + polling). Falta Stripe Connect OAuth/parcelamento (Etapa 27) |
| Email transacional | ✅ Completo | Voucher + notificação ao tenant |
| SEO e LGPD | ✅ Completo | Sitemap, pixels, consentimento |
| Super admin | ✅ Completo | MRR, tenants, planos, audit |
| Analytics do tenant | 🟡 85% | Cards + export PDF + gráficos históricos (receita/reservas/top produtos); falta só funil de conversão |
| Multi-usuário / equipes | ✅ Completo | Etapa 16 — convite por e-mail, RBAC por papel, gate de vagas por plano |
| Notificações in-app | ✅ Completo | Tabela + página + API + sino com badge e "marcar todas como lidas" no header |
| Avaliações / UGC | ✅ Completo | Etapa 23 — convite por e-mail, página pública, moderação, exibição no produto |
| Cupons e promoções | ✅ Completo | Etapa 24 — CRUD, validação, aplicação no checkout com consumo atômico |
| PIX, parcelamento e boleto | ✅ Completo | PIX + parcelamento (12x) + boleto (Etapa 27); falta só Stripe Connect OAuth (chaves manuais funcionam) |
| Cobrança da plataforma | ✅ (núcleo) | Etapa 29 — checkout de assinatura, portal Stripe, dunning com carência, prorate, sync de plano. Falta NF-e |
| Busca avançada no site | ✅ Completo | Etapa 22 — `/busca` com filtros, ordenação e URL compartilhável |
| CRM: leads e cotações | ✅ Completo | Etapa 26 — kanban, cotação digital pública, e-mail |
| CRM: score e segmentação | ✅ Completo | Etapa 31 — faixas configuráveis por tenant, tags, 360° |
| CRM: automações por gatilho | ✅ Completo | Etapa 32 — regras + worker via cron |
| WhatsApp Business API | ✅ Completo | Etapa 33 — 360dialog, credenciais criptografadas |
| Webhooks e API pública | ✅ Completo | Etapa 34 — HMAC, retry, chaves com hash e escopo `full`/`read_only` |
| Relatórios PDF white-label | ✅ Completo | Etapa 35 — mensal + por produto + cron de envio |
| Programa de fidelidade | ✅ Completo | Etapa 36 — regras, OTP, resgate no checkout, ranking |
| Carrinho multi-produto | ✅ Completo | Etapa 21 — order + N bookings, checkout em lote Stripe/MP, confirmação compartilhada |
| Programa de afiliados | ✅ Completo | Etapa 30 — ref cookie, atribuição, conversão no webhook, painel; falta automação de payout |
| Canal OTA / iCal | 🟡 70% | iCal export/import + cron (Etapa 25); falta Channel Manager via API |
| PWA / push | ✅ (núcleo) | Etapa 20 — instalável, SW offline, Web Push em nova reserva; faltam ícones PNG |
| Performance / Redis / ISR | 🟡 70% | Rate limit distribuído (Upstash), cache de produto por tenant, índice de bookings, circuit breaker WhatsApp, observabilidade. Falta cache de tenant config e staging |
| Testes automatizados | 🟡 55% | 72 unit tests + **CI no GitHub Actions** (typecheck+test+build a cada push/PR); falta E2E |
| Deploy de produção | 🔴 0% | Etapa 15 — desbloqueador |

---

## 🗂️ Variáveis de ambiente necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (plataforma — sua cobrança de tenants)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Resend)
RESEND_API_KEY=
PLATFORM_EMAIL_DOMAIN=turiapp.com.br

# Segurança (gerar com: openssl rand -hex 32)
ENCRYPTION_KEY=

# Vercel (para domínios próprios dos tenants)
VERCEL_API_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=          # opcional, só se usar Vercel Team

# Domínio da plataforma
NEXT_PUBLIC_PLATFORM_DOMAIN=turiapp.com.br

# Rate limiting distribuído (Etapa 28) — opcional mas recomendado em produção.
# Sem isso, o rate limit cai para in-memory por instância (funciona, mas não
# protege contra abuso distribuído na Vercel). Ver lib/rate-limit.ts.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoramento de erros (Etapa 28) — opcional. Se setado, lib/observability.ts
# encaminha erros ao Sentry. Sem isso, os erros vão só para os logs estruturados.
SENTRY_DSN=
```

---

## 🚀 Checklist de deploy inicial (Etapa 15)

```
[ ] 1. Criar projeto Supabase em supabase.com
[ ] 2. Executar, em ordem, todos os arquivos de db/migrations/001 a 026 (*.sql) — inclui realtime (025) e mídia no chat (026)
[ ] 2b. (Opcional, PWA push) Gerar chaves VAPID (`npx web-push generate-vapid-keys`) e setar NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT. Ícones placeholder já em public/icons/ (`node scripts/generate-icons.mjs`) — trocar por ícones desenhados antes do lançamento
[ ] 3. Executar: db/policies/rls.sql
[ ] 4. Criar bucket "media" no Supabase Storage → marcar como público; usado por imagens de produto e anexos do chat WhatsApp
[ ] 4b. Confirmar que o schema `audit` (migration 013) foi criado — só existe via SQL direto, não aparece no painel de tabelas padrão do Supabase Studio
[ ] 4c. Confirmar que a tabela `mfa_backup_codes` (migration 014) foi criada com RLS habilitado
[ ] 5. Adicionar domínio *.turiapp.com.br na Vercel
[ ] 6. Adicionar domínio app.turiapp.com.br (painel admin)
[ ] 7. Adicionar domínio admin.turiapp.com.br (super admin)
[ ] 8. Configurar todas as env vars na Vercel (ver seção acima)
[ ] 9. Verificar domínio turiapp.com.br no Resend (DKIM + SPF + DMARC)
[ ] 10. Configurar webhook Stripe → https://app.turiapp.com.br/api/webhooks/stripe
[ ] 11. Vercel Cron já configurado em vercel.json: /api/cron/automations, /webhooks-retry, /monthly-report e /ical-sync
[ ] 12. Deploy via Vercel CLI ou push para branch main
[ ] 13. No Supabase Studio: UPDATE user_profiles SET is_super_admin = true WHERE id = '<seu-user-id>'
[ ] 13b. Fazer login como esse super admin e completar o cadastro de MFA obrigatório em /mfa-enroll (guardar os 10 códigos de backup em local seguro)
[ ] 14. Smoke test: cadastro → onboarding → criar produto → fazer reserva → pagar → receber voucher
```

---

## 📁 Estrutura de arquivos relevantes

```
app/
  (public)/           → site público do tenant (resolvido por host)
    produto/[slug]/   → página do produto com BookingWidget
    checkout/         → [bookingId]/ e sucesso/
    not-found.tsx     → 404 com identidade visual do tenant
  (tenant-admin)/     → painel de gestão (app.turiapp.com.br)
    dashboard/        → métricas financeiras + reservas recentes
    produtos/         → CRUD + disponibilidade por calendário
    reservas/         → listagem + detalhe + export CSV
    clientes/         → CRM + score/segmentação + histórico 360° + LGPD
    leads/, cotacoes/ → kanban de pipeline + cotações digitais
    automacoes/       → regras de gatilho → ação
    notificacoes/     → centro de notificações internas
    whatsapp/         → conexão WhatsApp Business API (360dialog)
    relatorios/       → métricas + exportação de PDF
    fidelidade/       → regras de pontos + ranking de clientes
    temas/            → ThemeEditor
    paginas/          → PageBuilder
    pagamentos/       → Stripe/MP
    integracoes/      → Pixels/Analytics/webhooks/api
    configuracoes/    → dados, assinatura, domínio próprio, regras de CRM, segurança (MFA opcional)
  (super-admin)/      → painel admin (admin.turiapp.com.br)
  (auth)/             → login, cadastro, recuperar-senha, nova-senha, verificar-email, mfa, mfa-enroll
  onboarding/         → wizard 6 passos com preview ao vivo; layout com guard (redireciona p/ /dashboard se já é membro de um tenant)
  api/
    auth/             → login, reset-request, mfa/backup-codes, mfa/verify-backup
    bookings/         → create, action, export
    checkout/         → stripe, mercadopago
    tenants/          → create, settings, domain/add|remove|check
    availability/     → save
    payments/         → connect, disconnect
    webhooks/         → stripe, stripe-tenant, mercadopago
    lgpd/             → export, delete
    admin/            → planos, tenants, domains
    upload/           → Supabase Storage (imagens, mídia do chat e documentos públicos)
    leads/, quotes/   → pipeline de CRM
    automations/      → CRUD de regras
    integrations/     → whatsapp/, webhooks/, api-keys/
    whatsapp/send     → disparo de template
    conversations/    → inbox WhatsApp, mensagens, anexos e CRM da conversa
    public/           → API REST pública (bookings, products, customers, docs)
    reports/          → monthly.pdf, product/[id]
    cron/             → automations, webhooks-retry, monthly-report
    loyalty/          → login/request|verify, logout, me, redeem, settings/save
components/
  public/             → BookingWidget, CheckoutWidget, AnalyticsScripts, CookieConsent, LoyaltyRedeemWidget, LoyaltyAccount
  admin/              → ProductForm, AvailabilityCalendar, DomainManager, BookingActions, LoyaltySettingsForm, ReportsExporter, ...
  builder/            → ThemeEditor, PageBuilder, SectionRenderer
  ui/                 → design system (Button, Card, Input, ImageUpload, ...)
lib/
  crypto.ts           → AES-256-GCM
  rate-limit.ts       → in-memory (→ Upstash)
  audit.ts            → writeAuditLog
  vercel.ts           → Domains API
  stripe.ts           → lazy proxy
  mercadopago/        → HTTP direto (sem SDK)
  email/resend.ts     → voucher, notificação, cotação, fidelidade
  auth/super-admin.ts → isSuperAdmin(), requireAal2ForSuperAdmin()
  auth/mfa-gate.ts    → getMfaGateStatus() — checagem de AAL2/enrollment compartilhada entre super-admin e tenant-admin
  mfa/backup-codes.ts → geração, normalização e hash (SHA-256) dos códigos de backup
  supabase/           → server, client, middleware
  crm/segmentation.ts → faixas de score/tier configuráveis por tenant
  automations/        → templates.ts, render.ts
  whatsapp/           → 360dialog.ts, templates.ts
  webhooks/           → dispatch.ts (HMAC + retry), events.ts
  api-keys/auth.ts    → hash de chaves públicas
  reports/data.ts     → agregação para PDF
  loyalty/            → settings.ts, auth.ts (OTP), earn.ts, ledger.ts
references/
  projetos-base/      → projetos prontos usados como inspiração visual; excluídos do build/typecheck
db/
  migrations/         → 26 arquivos SQL completos (001 a 026)
  policies/rls.sql    → RLS em todas as tabelas de tenant
tests/
  lib/                → crypto, rate-limit, email, utils, mfa-backup-codes
  api/                → bookings-webhook
```
