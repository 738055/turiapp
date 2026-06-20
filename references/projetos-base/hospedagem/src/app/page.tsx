import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import HospedagemSection from "@/components/sections/HospedagemSection";
import ServicosSection from "@/components/sections/ServicosSection";
import ExperienciasSection from "@/components/sections/ExperienciasSection";
import AmbientesSection from "@/components/sections/AmbientesSection";
import DepoimentosSection from "@/components/sections/DepoimentosSection";
import LocalizacaoSection from "@/components/sections/LocalizacaoSection";
import CTASection from "@/components/sections/CTASection";
import type { Hospedagem, Servico, HeroConfig, CtaConfig, Depoimento, LocalizacaoDistancia, ConfigSite } from "@/lib/db/schema";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

async function getData() {
  try {
    const [hosp, serv, exp, amb, hero, cta, deps, locs, cfg] = await Promise.all([
      supabase.from("hospedagens").select("*").eq("status", "ativo").limit(6),
      supabase.from("servicos").select("*").eq("disponivel", true).limit(6),
      supabase.from("servicos").select("*").eq("categoria", "experiencia").limit(6),
      supabase.from("servicos").select("*").eq("categoria", "ambiente").limit(4),
      supabase.from("hero_config").select("*").eq("id", 1).single(),
      supabase.from("cta_config").select("*").eq("id", 1).single(),
      supabase.from("depoimentos").select("*").eq("ativo", true).order("ordem", { ascending: true }),
      supabase.from("localizacao_distancias").select("*").eq("ativo", true).order("ordem", { ascending: true }),
      supabase.from("config_site").select("*").eq("id", 1).single(),
    ]);

    return {
      hospItems:   (hosp.data  as Hospedagem[])           || [],
      servItems:   (serv.data  as Servico[])              || [],
      expItems:    (exp.data   as Servico[])              || [],
      ambItems:    (amb.data   as Servico[])              || [],
      heroConfig:  (hero.data  as HeroConfig | null)      ?? null,
      ctaConfig:   (cta.data   as CtaConfig | null)       ?? null,
      depoimentos: (deps.data  as Depoimento[])           || [],
      distancias:  (locs.data  as LocalizacaoDistancia[]) || [],
      siteConfig:  (cfg.data   as ConfigSite | null)      ?? null,
    };
  } catch {
    return {
      hospItems: [], servItems: [], expItems: [], ambItems: [],
      heroConfig: null, ctaConfig: null, depoimentos: [], distancias: [], siteConfig: null,
    };
  }
}

export default async function HomePage() {
  const { hospItems, servItems, expItems, ambItems, heroConfig, ctaConfig, depoimentos, distancias, siteConfig } = await getData();

  const whatsapp         = siteConfig?.whatsapp         || "5545999999999";
  const whatsappMensagem = siteConfig?.whatsapp_mensagem_reserva || "Olá, gostaria de fazer uma reserva na Mimosa Flor!";

  return (
    <>
      <Header
        nomeSite={siteConfig?.nome_site || undefined}
        tagline={siteConfig?.tagline || undefined}
        whatsapp={whatsapp}
        whatsappMensagem={whatsappMensagem}
      />
      <main>
        <Hero config={heroConfig} />
        <HospedagemSection hospedagens={hospItems} />
        <AmbientesSection ambientes={ambItems} />
        <ServicosSection servicos={servItems} />
        <ExperienciasSection experiencias={expItems} />
        <DepoimentosSection depoimentos={depoimentos} />
        <LocalizacaoSection distancias={distancias} config={siteConfig} />
        <CTASection config={ctaConfig} />
      </main>
      <Footer />
    </>
  );
}
