# TuriApp

SaaS white-label para negocios de turismo. Cada cliente tem uma loja publica,
catalogo, reservas, pagamentos, CRM, automacoes e atendimento via WhatsApp
Business, isolados por RLS no Supabase.

## Stack

- Next.js 16 App Router
- Supabase Auth, Postgres, Storage e RLS
- Stripe Subscriptions para cobranca da plataforma
- Stripe/Mercado Pago para pagamentos das lojas
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
5. Para WhatsApp, conecte a loja em `/whatsapp` e configure o webhook exibido
   na tela no painel da 360dialog.

## Atendimento WhatsApp

A central em `/conversas` suporta:

- conversas inbound/outbound por loja;
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
nativos em `lib/store-templates.ts`. No onboarding, o cliente escolhe um modelo,
ve preview em tempo real e recebe uma copia editavel de:

- tema visual;
- paginas prontas: home, sobre, FAQ, contato, termos e privacidade;
- menu/header publico;
- secoes com estilo do modelo;
- footer profissional editavel com contato, links, texto legal e redes sociais;
- primeiro produto com campos ricos;
- layout de cards e hero.

Os modelos ficam separados por tipo para facilitar a escolha do cliente:

- Multiuso: Turismo Direto;
- Receptivo: Receptivo Premium, Aventura Local, Ingressos & Atrativos e Transfer Executivo;
- Emissivo: Agencia de Pacotes, Viagens Premium, Cruzeiros & Grupos, Excursoes Rodoviarias e Intercambio & Estudos;
- Hospedagem: Hospedagem Boutique, Resort & Day Use, Chales & Natureza, Hotel Executivo e Temporada Familiar.

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

## Banners, Midia E Promocoes

O painel usa upload direto no bucket `media` (sem colar URL). Imagens sao
convertidas para **WebP** automaticamente (`sharp`, no maximo 2400px, orientacao
EXIF corrigida) em `app/api/upload/route.ts`. Cada campo de imagem mostra a
**dimensao recomendada** para nao cortar o banner:

- Hero (fundo): 1920×1080 (16:9) — no celular recorta para retrato, foco no centro;
- Banner promocional: 1600×600 (8:3);
- Card de promocao: 800×500 (16:10);
- Sobre: 1000×1250 (4:5).

O **hero tambem aceita video** de fundo (MP4/WebM em loop, mudo, com a imagem como
poster) nas variantes classic/marketplace/editorial — recomendado ate ~8 MB para
manter a performance.

A secao **Ofertas & promocoes** (estilo Decolar/Broker) cria cards promocionais com
foto, selo de desconto e CTA, com scroll horizontal no mobile e grade no desktop.

SEO pronto para indexacao e trafego pago: `sitemap.xml`/`robots.txt` por tenant,
canonical/OG, JSON-LD de Organization, WebSite (SearchAction), BreadcrumbList e
Product (com offers e aggregateRating). Pixels/tags (Meta, TikTok, Google Ads, GTM)
disponiveis em todos os planos pagos, configurados em `/integracoes`.

## Deploy

Use `GO-LIVE.md` como runbook de producao. O `STATUS.md` e a fonte rapida do
estado atual, pendencias e mapa de arquivos.

## Dominio De Teste Para Lojas

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
# opcional: quando o painel for acessado por outro host que precisa emoldurar previews
PREVIEW_FRAME_HOSTS=turiapp-two.vercel.app,www.nitromethanebrasil.com.br
```

Sem o wildcard associado ao projeto, a Vercel retorna `DEPLOYMENT_NOT_FOUND`
antes da TuriApp receber a request.

O preview real de Aparencia/Paginas usa iframe. O CSP permite abrir destinos
HTTPS em `frame-src` para suportar dominios proprios verificados das lojas,
mas o storefront so aceita ser emoldurado pelos hosts da propria plataforma via
`frame-ancestors`. A Vercel URL do proprio deploy entra automaticamente quando
`VERCEL_URL`/`VERCEL_PROJECT_PRODUCTION_URL` estiverem disponiveis; se o painel
for acessado por outro host, adicione esse host exato em `PREVIEW_FRAME_HOSTS`.
