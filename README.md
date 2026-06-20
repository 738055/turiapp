# TuriApp

SaaS white-label para negocios de turismo. Cada tenant tem storefront publico,
catalogo, reservas, pagamentos, CRM, automacoes e atendimento via WhatsApp
Business, isolados por RLS no Supabase.

## Stack

- Next.js 16 App Router
- Supabase Auth, Postgres, Storage e RLS
- Stripe Subscriptions para cobranca da plataforma
- Stripe/Mercado Pago para pagamentos dos tenants
- Resend para e-mails
- 360dialog para WhatsApp Business API

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

Comandos uteis:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Configuracao Essencial

1. Copie `.env.example` ou `.env.production.example`.
2. Configure Supabase, Stripe, Mercado Pago, Resend e chaves de criptografia.
3. Rode as migrations em `db/migrations` e depois `db/policies/rls.sql`.
4. Crie o bucket publico `media` no Supabase Storage.
5. Para WhatsApp, conecte o tenant em `/whatsapp` e configure o webhook exibido
   na tela no painel da 360dialog.

## Atendimento WhatsApp

A central em `/conversas` suporta:

- conversas inbound/outbound por tenant;
- janela de 24h da Meta para texto livre;
- templates aprovados fora da janela;
- anexos dentro da janela: imagem, audio, video e documentos;
- renderizacao de imagem, audio, video e arquivo diretamente na bolha;
- CRM no chat: atendente, status, etiquetas, notas internas e conversao em
  cliente/lead.

Migrations relacionadas: `023_conversations.sql`, `024_conversation_crm.sql`,
`025_realtime.sql` e `026_message_media.sql`.

## Modelos De Loja

Projetos prontos usados como referencia visual devem ficar em:

```txt
references/projetos-base/
```

Essa pasta nao entra no build nem no typecheck. A TuriApp extrai deles modelos
nativos em `lib/store-templates.ts`. No onboarding, o tenant escolhe um modelo,
ve preview em tempo real e recebe uma copia editavel de:

- tema visual;
- paginas prontas: home, sobre, FAQ, contato, termos e privacidade;
- menu/header publico;
- secoes com estilo do modelo;
- primeiro produto com campos ricos;
- layout de cards e hero.

Depois da criacao da loja, o painel `/temas` permite escolher outro modelo,
previsualizar o resultado ao vivo, salvar apenas o visual ou aplicar o modelo
completo na loja. Aplicar o modelo atualiza home, paginas prontas e menu, mas
mantem os produtos cadastrados.

O produto usa `extra_data` para alimentar o design com informacoes como duracao,
local, destaques, inclui, nao inclui, roteiro, politica de cancelamento,
idiomas do guia, galeria adicional e dados de hospedagem
(capacidade/quartos/banheiros). Esses campos aparecem no card, na busca e na
pagina de detalhe do produto. Campos de lista e roteiro sao editados por itens
guiados no painel, evitando sintaxe manual por linha.

## Deploy

Use `GO-LIVE.md` como runbook de producao. O `STATUS.md` e a fonte rapida do
estado atual, pendencias e mapa de arquivos.

## Dominio De Teste Para Tenants

Para usar um dominio como `nitromethanebrasil.com.br` em testes de lojas
(`rotas-e-horizontes.nitromethanebrasil.com.br`), adicione no mesmo projeto da
Vercel:

- `nitromethanebrasil.com.br`
- `*.nitromethanebrasil.com.br`

E configure as envs do deploy:

```env
NEXT_PUBLIC_PLATFORM_HOST=nitromethanebrasil.com.br
NEXT_PUBLIC_APP_HOST=app.nitromethanebrasil.com.br
NEXT_PUBLIC_ADMIN_HOST=admin.nitromethanebrasil.com.br
# opcional: painel/preview hospedado em outro host
PREVIEW_FRAME_HOSTS=turiapp-two.vercel.app,www.nitromethanebrasil.com.br
```

Sem o wildcard associado ao projeto, a Vercel retorna `DEPLOYMENT_NOT_FOUND`
antes da TuriApp receber a request.

O preview real de Aparencia/Paginas usa iframe. O CSP permite abrir lojas da
plataforma em `frame-src`, mas o storefront so aceita ser emoldurado pelos hosts
da propria plataforma via `frame-ancestors`. A Vercel URL do proprio deploy
entra automaticamente quando `VERCEL_URL`/`VERCEL_PROJECT_PRODUCTION_URL`
estiverem disponiveis; se o painel for acessado por outro host, adicione esse
host exato em `PREVIEW_FRAME_HOSTS`.
