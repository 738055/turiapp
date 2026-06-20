import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContatoForm from "@/components/contato/ContatoForm";
import type { Metadata } from "next";
import type { ConfigSite } from "@/lib/db/schema";
import { supabase } from "@/lib/supabase";
import { Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com a Mimosa Flor para reservas e informações.",
};

export const revalidate = 0;

async function getConfig(): Promise<ConfigSite | null> {
  try {
    const { data } = await supabase.from("config_site").select("*").eq("id", 1).single();
    return data as ConfigSite | null;
  } catch {
    return null;
  }
}

export default async function ContatoPage() {
  const cfg = await getConfig();

  const whatsapp      = cfg?.whatsapp     || "5545999999999";
  const mensagemContato = cfg?.whatsapp_mensagem_contato || "Olá! Gostaria de informações sobre a Mimosa Flor.";
  const telefone      = cfg?.telefone     || "+55 (45) 9 9999-9999";
  const email         = cfg?.email        || "contato@mimosaflor.com.br";
  const endereco      = cfg?.endereco     || "Rua Iguaraçu, 140 - Foz do Iguaçu, PR";
  const lat           = cfg?.latitude     ?? -25.571917;
  const lng           = cfg?.longitude    ?? -54.516338;
  const mapLink       = `https://maps.google.com/?q=${lat},${lng}`;
  const nomeSite      = cfg?.nome_site    || "Mimosa Flor";
  const tagline       = cfg?.tagline      || "Casa de Campo";
  const mensagemReserva = cfg?.whatsapp_mensagem_reserva || "Olá, gostaria de fazer uma reserva na Mimosa Flor!";

  return (
    <>
      <Header
        nomeSite={nomeSite}
        tagline={tagline}
        whatsapp={whatsapp}
        whatsappMensagem={mensagemReserva}
      />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-[#1C3A2A] py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-5">
            <div className="w-full h-full" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          </div>
          <div className="max-w-7xl mx-auto">
            <p className="text-[#B8963E] text-[11px] tracking-[0.35em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>
              Fale conosco
            </p>
            <h1 className="text-[#FAF7F2] text-[clamp(2.5rem,6vw,5rem)] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
              Vamos planejar
              <br />
              <em className="not-italic text-[#B8963E]">sua estadia</em>.
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <ContatoForm whatsapp={whatsapp} whatsappMensagemContato={mensagemContato} />

            {/* Info */}
            <div className="space-y-10">
              <div>
                <h2 className="text-[#1C3A2A] text-3xl mb-8" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
                  Informações de contato
                </h2>
                <div className="space-y-6">
                  {[
                    { icon: Phone,  label: "Telefone / WhatsApp", value: telefone, href: `https://wa.me/${whatsapp}` },
                    { icon: Mail,   label: "E-mail",              value: email,    href: `mailto:${email}` },
                    { icon: MapPin, label: "Localização",         value: endereco, href: mapLink },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-4 group">
                      <div className="w-10 h-10 border border-[#1C3A2A]/20 flex items-center justify-center shrink-0 group-hover:border-[#C4623A] transition-colors">
                        <Icon className="w-4 h-4 text-[#C4623A]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[#1C3A2A]/40 text-xs tracking-wider uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>{label}</p>
                        <p className="text-[#1C3A2A] text-sm group-hover:text-[#C4623A] transition-colors" style={{ fontFamily: "var(--font-body)" }}>{value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
