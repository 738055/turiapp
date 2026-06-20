import Link from "next/link";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  CreditCard,
  FileText,
  Globe,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata = {
  title: "TuriApp - site, reservas e CRM para negocios de turismo",
  description:
    "Crie uma loja white-label para turismo, cadastre produtos, venda por WhatsApp ou reservas online, gerencie CRM e atendimento nos planos Pro e Enterprise.",
};

const OPERATIONS = [
  {
    icon: MapPin,
    title: "Receptivo",
    text: "Passeios, ingressos, transfers e experiencias locais com roteiro, inclusos, horarios e atendimento claro.",
  },
  {
    icon: Plane,
    title: "Emissivo",
    text: "Pacotes, grupos, cruzeiros e viagens sob medida com cotacoes, datas, condicoes e proposta digital.",
  },
  {
    icon: Globe,
    title: "Hospedagem",
    text: "Pousadas, hoteis, chales e temporada com fotos grandes, tarifas, regras e disponibilidade.",
  },
];

const STACK = [
  { icon: Globe, title: "Loja white-label", text: "Templates profissionais por nicho, paginas prontas, dominio e identidade visual." },
  { icon: CalendarCheck, title: "Produtos e reservas", text: "Cadastro rico, tarifas, disponibilidade, carrinho e checkout online no Pro." },
  { icon: CreditCard, title: "Pagamentos diretos", text: "PIX, cartao e boleto indo para a conta do tenant, sem comissao da plataforma." },
  { icon: Target, title: "CRM Pro", text: "Leads, clientes, cotacoes, pipeline e segmentacao comercial nos planos Pro e Enterprise." },
  { icon: MessageCircle, title: "Atendimento Pro", text: "Central WhatsApp, historico, notas, responsaveis e respostas pela equipe." },
  { icon: FileText, title: "Operacao organizada", text: "FAQ, termos, paginas, automacoes, relatorios e conteudo pronto para editar." },
];

const PLANS = [
  {
    name: "Basico",
    price: "97",
    subtitle: "Para publicar a loja e vender por contato direto.",
    highlight: false,
    features: [
      "Loja profissional com templates",
      "Ate 20 produtos",
      "Paginas editaveis",
      "Botao WhatsApp nos produtos",
      "Subdominio TuriApp",
      "1 usuario",
    ],
    note: "CRM, atendimento, reservas online e dominio proprio ficam no Pro.",
  },
  {
    name: "Pro",
    price: "197",
    subtitle: "Para operar vendas, reservas, CRM e atendimento.",
    highlight: true,
    features: [
      "Tudo do Basico",
      "Ate 100 produtos",
      "Motor de reservas online",
      "PIX, cartao e boleto",
      "Dominio proprio",
      "CRM e cotacoes",
      "Atendimento WhatsApp",
      "Pixels e Analytics",
      "3 usuarios",
    ],
    note: "Plano ideal para agencias, receptivos e hospedagens que vendem todos os dias.",
  },
  {
    name: "Enterprise",
    price: "397",
    subtitle: "Para escalar operacao, equipe e catalogo.",
    highlight: false,
    features: [
      "Tudo do Pro",
      "Produtos ilimitados",
      "Paginas ilimitadas",
      "Usuarios ilimitados",
      "Automacoes avancadas",
      "API publica",
      "Suporte prioritario",
    ],
    note: "No sistema este tier corresponde ao Premium.",
  },
];

const FAQ = [
  {
    q: "O trial libera tudo?",
    a: "O trial permite conhecer a plataforma e montar a loja. Recursos operacionais como CRM, atendimento, WhatsApp Business e configuracoes comerciais Pro aparecem como preview, mas so podem ser configurados depois do upgrade.",
  },
  {
    q: "A TuriApp cobra comissao?",
    a: "Nao. O tenant paga a assinatura. Quando usa checkout online, o pagamento vai para a propria conta Stripe ou Mercado Pago do tenant.",
  },
  {
    q: "Preciso de designer?",
    a: "Nao. O tenant escolhe um modelo pronto por tipo de negocio e edita cores, conteudo, produtos, footer, paginas e secoes guiadas.",
  },
  {
    q: "Serve para agencia e hospedagem?",
    a: "Sim. A estrutura foi pensada para receptivo, emissivo e hospedagem, com campos como inclui, nao inclui, roteiro, politica, tarifas e galeria.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#141414]">
      <LandingHeader />

      <section className="relative flex min-h-[84vh] items-end overflow-hidden bg-[#17231f]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/storefront/receptivo/hero-cataratas.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#17231f] via-[#17231f]/45 to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-28 lg:grid-cols-[1fr_420px] lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase backdrop-blur">
              <BadgeCheck className="h-4 w-4 text-[#f7c46c]" />
              Loja, reservas e operacao para turismo
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.02] md:text-7xl">
              TuriApp para turismo
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/78 md:text-xl">
              Uma plataforma white-label para agencias, receptivos e hospedagens venderem com uma loja bonita,
              produtos completos, reservas online e atendimento profissional.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f7c46c] px-6 py-3.5 text-sm font-bold text-[#1f2933] transition hover:bg-[#ffd886]"
              >
                Comecar teste gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#planos"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Comparar planos
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#f7c46c]" /> Sem comissao</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#f7c46c]" /> 14 dias de teste</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#f7c46c]" /> Feito para turismo</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/12 p-4 text-white shadow-2xl backdrop-blur-md">
            <div className="rounded-xl bg-white p-4 text-[#17231f]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400">Preview da loja</p>
                  <p className="text-lg font-bold">Rotas e Horizontes</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Online</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('/storefront/receptivo/hero-cataratas.jpg')" }} />
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-semibold text-[#007f73]">Passeio local</p>
                    <p className="font-bold">Cataratas com transfer</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <span className="rounded-lg bg-gray-50 py-2">Inclui</span>
                    <span className="rounded-lg bg-gray-50 py-2">Roteiro</span>
                    <span className="rounded-lg bg-gray-50 py-2">Tarifas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-extrabold">R$ 199</p>
                    <span className="rounded-lg bg-[#007f73] px-3 py-2 text-xs font-bold text-white">Reservar</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/72">
              O tenant parte de modelos prontos, troca identidade, edita secoes e vende com conteudo completo.
            </p>
          </div>
        </div>
      </section>

      <section id="recursos" className="bg-[#17231f] px-5 py-8 text-white">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {OPERATIONS.map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-white/6 p-5">
              <item.icon className="h-6 w-6 text-[#f7c46c]" />
              <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-[#007f73]">Produto completo</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              O que antes ficava espalhado, agora vira uma operacao unica.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              A TuriApp organiza vitrine, produto, pagamento, CRM e atendimento com regras de plano claras.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STACK.map((item) => (
              <div key={item.title} className="rounded-xl border border-[#ded8cc] bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8f4ef] text-[#007f73]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white px-5 py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase text-[#007f73]">Fluxo real</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Feito para vender pacote, passeio, diaria e experiencia sem improviso.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              O cadastro do produto alimenta os cards, a busca e a pagina de detalhe com tudo que o cliente precisa para decidir.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["1", "Escolha um modelo", "Receptivo, emissivo, hospedagem ou multiuso, com paginas e secoes editaveis."],
              ["2", "Cadastre produtos ricos", "Inclui, nao inclui, roteiro, politica, tarifas, galeria e informacoes importantes."],
              ["3", "Venda no canal certo", "Basico por WhatsApp. Pro com reservas, pagamentos, CRM, atendimento e dominio proprio."],
            ].map(([number, title, text]) => (
              <div key={number} className="grid grid-cols-[48px_1fr] gap-4 rounded-xl border border-gray-100 bg-[#fbfaf7] p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#17231f] text-lg font-bold text-[#f7c46c]">{number}</span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="px-5 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase text-[#007f73]">Planos</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Comece simples. Ative a operacao completa quando estiver pronto.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Trial e Basico mostram a plataforma. Configuracoes de CRM e atendimento sao liberadas no Pro.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  plan.highlight ? "border-[#007f73] ring-2 ring-[#007f73]/15" : "border-[#ded8cc]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[#007f73] px-3 py-1 text-xs font-bold text-white">
                    Mais usado
                  </span>
                )}
                <h3 className="text-2xl font-extrabold">{plan.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-gray-500">{plan.subtitle}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="pb-2 text-sm font-semibold text-gray-500">R$</span>
                  <span className="text-5xl font-extrabold">{plan.price}</span>
                  <span className="pb-2 text-sm text-gray-500">/mes</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#007f73]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-[#f7f4ef] p-3 text-xs leading-relaxed text-gray-600">{plan.note}</p>
                <Link
                  href="/cadastro"
                  className={`mt-5 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold ${
                    plan.highlight ? "bg-[#007f73] text-white hover:bg-[#006b61]" : "border border-gray-200 text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Comecar agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#17231f] px-5 py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase text-[#f7c46c]">Pro no momento certo</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Trial mostra o caminho. Pro libera a operacao.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
              O tenant pode montar a loja, entender o potencial e visualizar recursos profissionais. Para configurar CRM,
              atendimento, WhatsApp Business e envios externos, precisa subir para Pro ou Enterprise.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-5">
            {[
              ["Trial", "Conhece a plataforma, monta a loja e visualiza recursos Pro."],
              ["Basico", "Publica loja, cadastra produtos e vende por WhatsApp simples."],
              ["Pro", "Opera CRM, atendimento, dominio, reservas, pagamentos e analytics."],
              ["Enterprise", "Escala catalogo, equipe, automacoes e API."],
            ].map(([label, text]) => (
              <div key={label} className="border-b border-white/10 py-4 last:border-b-0">
                <p className="font-bold text-[#f7c46c]">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/68">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase text-[#007f73]">FAQ</p>
            <h2 className="mt-3 text-4xl font-extrabold">Perguntas importantes</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-100 bg-[#fbfaf7] p-5">
                <summary className="cursor-pointer font-bold text-gray-950">{item.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#007f73] px-6 py-12 text-center text-white">
          <Sparkles className="mx-auto h-7 w-7 text-[#f7c46c]" />
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-tight">
            Monte uma loja de turismo com cara de marca grande.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Comece pelo modelo certo, cadastre seus produtos e ative os recursos Pro quando quiser operar vendas de ponta a ponta.
          </p>
          <Link
            href="/cadastro"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#007f73] hover:bg-[#f7f4ef]"
          >
            Criar conta gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#ded8cc] bg-[#f7f4ef] px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-extrabold">TuriApp</p>
            <p className="mt-1 text-sm text-gray-500">White-label profissional para negocios de turismo.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-medium text-gray-600">
            <a href="#recursos" className="hover:text-gray-950">Recursos</a>
            <a href="#planos" className="hover:text-gray-950">Planos</a>
            <a href="#faq" className="hover:text-gray-950">FAQ</a>
            <Link href="/login" className="hover:text-gray-950">Entrar</Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Sem comissao sobre as vendas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
