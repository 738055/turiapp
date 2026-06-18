import Link from "next/link";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import {
  ArrowRight, Check, Sparkles, Globe, CalendarCheck, CreditCard, Users,
  MessageCircle, BarChart3, Ticket, Star, Zap, ShieldCheck, Smartphone,
  Palette, Building2, Plane, MapPin, TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "TuriApp — Site, reservas e pagamentos para o seu negócio de turismo",
  description:
    "Crie seu site profissional, receba reservas e pagamentos online (PIX, cartão, boleto), gerencie clientes e venda mais. Sem comissão sobre suas vendas. 14 dias grátis.",
};

const FEATURES = [
  { icon: Globe, title: "Site profissional", desc: "Seu site white-label com sua marca, cores e domínio próprio. Pronto em minutos." },
  { icon: CalendarCheck, title: "Motor de reservas", desc: "Calendário de disponibilidade, tarifas por temporada e reserva online 24h." },
  { icon: CreditCard, title: "Pagamentos diretos", desc: "PIX, cartão em até 12x e boleto — o dinheiro cai direto na SUA conta." },
  { icon: Users, title: "CRM completo", desc: "Pipeline de leads, cotações digitais, histórico 360° e segmentação de clientes." },
  { icon: MessageCircle, title: "WhatsApp Business", desc: "Botão de contato e disparos automáticos integrados ao seu fluxo de vendas." },
  { icon: Zap, title: "Automações", desc: "Lembretes, follow-ups e mensagens automáticas por gatilho. Venda no piloto automático." },
  { icon: Ticket, title: "Cupons & fidelidade", desc: "Crie promoções, programa de pontos e avaliações para fidelizar e vender mais." },
  { icon: BarChart3, title: "Relatórios", desc: "Receita, ticket médio, produtos campeões e relatórios PDF com a sua marca." },
];

const STEPS = [
  { n: "1", title: "Crie sua conta", desc: "Cadastro grátis em 1 minuto e personalize seu site com sua marca e cores." },
  { n: "2", title: "Cadastre seus produtos", desc: "Passeios, hospedagens, pacotes — com fotos, tarifas e disponibilidade." },
  { n: "3", title: "Venda no automático", desc: "Receba reservas e pagamentos online enquanto cuida do seu negócio." },
];

const MODULES = [
  { icon: Building2, title: "Hospedagem", desc: "Pousadas, hotéis e aluguéis por temporada com calendário e sincronização iCal (Airbnb, Booking)." },
  { icon: MapPin, title: "Receptivo", desc: "Passeios, ingressos, experiências e transporte com reserva e pagamento na hora." },
  { icon: Plane, title: "Emissivo", desc: "Pacotes e viagens com carrinho de múltiplos produtos e cotações personalizadas." },
];

const PLANS = [
  {
    name: "Básico", price: "97", popular: false,
    tagline: "Para começar a vender",
    features: ["Site profissional", "Até 20 produtos", "Botão WhatsApp", "Subdomínio gratuito", "1 usuário"],
    cta: "Começar grátis",
  },
  {
    name: "Pro", price: "197", popular: true,
    tagline: "O mais escolhido",
    features: ["Tudo do Básico", "Até 100 produtos", "Motor de reservas online", "PIX, cartão e boleto", "Domínio próprio", "Pixels e Analytics", "3 usuários"],
    cta: "Assinar o Pro",
  },
  {
    name: "Premium", price: "397", popular: false,
    tagline: "Para escalar de verdade",
    features: ["Tudo do Pro", "Produtos ilimitados", "Automações por gatilho", "WhatsApp Business API", "Programa de fidelidade", "API pública", "Usuários ilimitados"],
    cta: "Assinar o Premium",
  },
];

const FAQ = [
  { q: "A plataforma cobra comissão sobre as minhas vendas?", a: "Não. Você paga apenas a assinatura mensal. Os pagamentos dos seus clientes vão direto para a sua conta Stripe ou Mercado Pago — a TuriApp nunca intermedia o dinheiro das suas vendas." },
  { q: "Preciso saber programar ou ter um designer?", a: "Não. Você monta seu site com um editor visual, escolhe cores, fontes e seções prontas. Tudo sem código." },
  { q: "Posso usar meu próprio domínio?", a: "Sim, nos planos Pro e Premium. Você conecta seu domínio (ex.: www.suaempresa.com.br) em poucos cliques e o certificado de segurança (SSL) é emitido automaticamente." },
  { q: "Funciona no celular?", a: "Sim. Tanto o seu site quanto o painel de gestão funcionam perfeitamente no celular — e você pode instalar o painel como app e receber notificações de novas reservas." },
  { q: "Preciso de cartão de crédito para testar?", a: "Não. São 14 dias grátis, sem cartão. Você só decide o plano quando estiver convencido." },
  { q: "Para quais negócios serve?", a: "Pousadas, hotéis, agências, guias, operadoras e qualquer negócio de turismo — hospedagem, receptivo (passeios) ou emissivo (pacotes)." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <LandingHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-200/60 via-cyan-100/40 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" /> A plataforma completa para o turismo
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Seu site, suas reservas e seus pagamentos —{" "}
            <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">tudo em um só lugar</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Crie um site profissional, receba reservas e pagamentos online e gerencie seus clientes.
            Sem comissão sobre as vendas — o dinheiro cai direto na sua conta.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-xl hover:shadow-sky-500/40 sm:w-auto"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#recursos" className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto">
              Ver recursos
            </a>
          </div>

          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> 14 dias grátis</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Sem cartão</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Sem comissão</span>
          </p>

          {/* Dashboard mockup */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-300/40">
              <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white">
                <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400">suaempresa.turiapp.com.br</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-3">
                  {[
                    { label: "Receita do mês", value: "R$ 42.380", trend: "+18%", color: "text-emerald-600" },
                    { label: "Reservas", value: "127", trend: "+9%", color: "text-sky-600" },
                    { label: "Ticket médio", value: "R$ 334", trend: "+4%", color: "text-violet-600" },
                  ].map((c) => (
                    <div key={c.label} className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm">
                      <p className="text-xs text-gray-400">{c.label}</p>
                      <p className="mt-1 text-2xl font-bold">{c.value}</p>
                      <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${c.color}`}>
                        <TrendingUp className="h-3 w-3" /> {c.trend}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-6">
                  <div className="flex h-32 items-end gap-2 rounded-xl border border-gray-100 bg-white p-4">
                    {[40, 65, 50, 80, 60, 95, 75, 100, 85, 70, 90, 78].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-sky-500 to-cyan-400" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
          {[
            { v: "0%", l: "de comissão nas vendas" },
            { v: "3", l: "módulos de turismo" },
            { v: "PIX", l: "cartão e boleto" },
            { v: "14 dias", l: "grátis para testar" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Recursos ───────── */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo que você precisa para vender mais</h2>
          <p className="mt-4 text-lg text-gray-600">Um sistema só, no lugar de cinco. Do site ao pagamento, da reserva ao pós-venda.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-sky-100 hover:shadow-lg hover:shadow-sky-500/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Como funciona ───────── */}
      <section id="como-funciona" className="bg-gray-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">No ar em 3 passos</h2>
            <p className="mt-4 text-lg text-gray-600">Sem técnico, sem agência, sem complicação.</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-gray-100 bg-white p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-lg font-bold text-white shadow-lg shadow-sky-500/30">
                  {s.n}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Módulos ───────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Feito para o seu tipo de negócio</h2>
          <p className="mt-4 text-lg text-gray-600">Hospedagem, receptivo ou emissivo — a TuriApp se adapta a você.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.title} className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Planos ───────── */}
      <section id="planos" className="bg-gray-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos que cabem no seu bolso</h2>
            <p className="mt-4 text-lg text-gray-600">Comece grátis. Faça upgrade quando crescer. Cancele quando quiser.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-7 ${
                  p.popular ? "border-sky-500 shadow-xl shadow-sky-500/10 lg:scale-[1.03]" : "border-gray-200"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-sky-500/30">
                    MAIS POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.tagline}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-sm font-semibold text-gray-500">R$</span>
                  <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="mb-1.5 text-sm text-gray-500">/mês</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    p.popular
                      ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl"
                      : "border border-gray-200 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-gray-400" /> Sem fidelidade. Cancele a qualquer momento.
          </p>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          <p className="mt-4 text-lg text-gray-600">Ainda com dúvidas? A gente responde.</p>
        </div>
        <div className="mt-12 space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-gray-100 bg-white p-5 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-gray-900">
                {item.q}
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── CTA final ───────── */}
      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 px-6 py-16 text-center shadow-2xl shadow-sky-500/30">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 80%, white 0, transparent 40%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
              Pronto para vender mais e trabalhar menos?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sky-50">
              Monte seu site e comece a receber reservas hoje. 14 dias grátis, sem cartão.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/cadastro" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-sky-600 shadow-lg transition-transform hover:scale-105 sm:w-auto">
                Criar minha conta grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-white">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="font-bold text-gray-900">TuriApp</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <a href="#recursos" className="hover:text-gray-900">Recursos</a>
            <a href="#planos" className="hover:text-gray-900">Planos</a>
            <a href="#faq" className="hover:text-gray-900">Perguntas</a>
            <Link href="/login" className="hover:text-gray-900">Entrar</Link>
            <Link href="/cadastro" className="font-semibold text-sky-600 hover:text-sky-700">Criar conta</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} TuriApp · Feito para o turismo</p>
        </div>
        <div className="flex items-center justify-center gap-4 pb-8 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Funciona no celular</span>
          <span className="inline-flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Sua marca</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Sem comissão</span>
        </div>
      </footer>
    </div>
  );
}
