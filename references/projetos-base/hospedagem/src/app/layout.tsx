import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SeoConfig, ConfigSite, ScriptMarketing } from "@/lib/db/schema";
import { supabase } from "@/lib/supabase";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mimosaflor.com.br";

export async function generateMetadata(): Promise<Metadata> {
  let seoConfig: SeoConfig | null = null;
  try {
    const { data } = await supabase.from("seo_config").select("*").eq("id", 1).single();
    seoConfig = data as SeoConfig | null;
  } catch {}

  const tituloPadrao = seoConfig?.titulo_padrao || "Mimosa Flor — Casa de Campo em Foz do Iguaçu";
  const descPadrao   = seoConfig?.descricao_padrao || "Uma experiência sensorial única em meio à natureza. Casa de campo exclusiva em Foz do Iguaçu, Paraná, Brasil.";
  const geoRegion    = seoConfig?.geo_region    || "BR-PR";
  const geoPlacename = seoConfig?.geo_placename || "Foz do Iguaçu, Paraná, Brasil";
  const geoPosition  = seoConfig?.geo_position  || "-25.571917;-54.516338";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: tituloPadrao, template: "%s | Mimosa Flor" },
    description: descPadrao,
    keywords: ["casa de campo", "Foz do Iguaçu", "hospedagem", "Cataratas do Iguaçu", "turismo", "Mimosa Flor"],
    authors: [{ name: "Mimosa Flor" }],
    creator: "Mimosa Flor",
    openGraph: {
      type: "website", locale: "pt_BR", url: SITE_URL, siteName: "Mimosa Flor",
      title: tituloPadrao, description: descPadrao,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: tituloPadrao, description: descPadrao, images: ["/og-image.jpg"] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    verification: {
      google: seoConfig?.google_verification || undefined,
      other: seoConfig?.bing_verification ? { "msvalidate.01": seoConfig.bing_verification } : undefined,
    },
    alternates: { canonical: SITE_URL, languages: { "pt-BR": SITE_URL } },
    other: {
      "geo.region": geoRegion,
      "geo.placename": geoPlacename,
      "geo.position": geoPosition,
      "ICBM": geoPosition.replace(";", ", "),
    },
  };
}

async function getLayoutData() {
  try {
    const [cfgRes, scriptsRes] = await Promise.all([
      supabase.from("config_site").select("*").eq("id", 1).single(),
      supabase.from("scripts_marketing").select("*").eq("ativo", true),
    ]);
    return {
      cfg:     (cfgRes.data     as ConfigSite | null)   ?? null,
      scripts: (scriptsRes.data as ScriptMarketing[])   || [],
    };
  } catch {
    return { cfg: null, scripts: [] };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { cfg, scripts } = await getLayoutData();

  const nomeSite  = cfg?.nome_site  || "Mimosa Flor — Casa de Campo";
  const descricao = cfg?.descricao_site || "Casa de campo exclusiva em Foz do Iguaçu, próxima às Cataratas do Iguaçu.";
  const telefone  = cfg?.telefone   || "+55 45 99999-9999";
  const endereco  = cfg?.endereco   || "Rua Iguaraçu, n° 140";
  const lat       = cfg?.latitude   ?? -25.571917;
  const lng       = cfg?.longitude  ?? -54.516338;
  const checkin   = cfg?.horario_checkin  || "14:00";
  const checkout  = cfg?.horario_checkout || "11:00";

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: nomeSite,
    description: descricao,
    url: SITE_URL,
    telephone: telefone,
    address: {
      "@type": "PostalAddress",
      streetAddress: endereco,
      addressLocality: "Foz do Iguaçu",
      addressRegion: "PR",
      addressCountry: "BR",
    },
    geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
    image: `${SITE_URL}/og-image.jpg`,
    priceRange: "$$",
    checkinTime:  checkin,
    checkoutTime: checkout,
  };

  const headScripts    = scripts.filter((s) => s.posicao === "head");
  const bodyStartScripts = scripts.filter((s) => s.posicao === "body_start");
  const bodyEndScripts   = scripts.filter((s) => s.posicao === "body_end");

  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
        {headScripts.map((s) => (
          <div key={s.id} dangerouslySetInnerHTML={{ __html: s.conteudo }} />
        ))}
      </head>
      <body className="min-h-screen antialiased">
        {bodyStartScripts.map((s) => (
          <div key={s.id} dangerouslySetInnerHTML={{ __html: s.conteudo }} />
        ))}
        {children}
        {bodyEndScripts.map((s) => (
          <div key={s.id} dangerouslySetInnerHTML={{ __html: s.conteudo }} />
        ))}
      </body>
    </html>
  );
}
