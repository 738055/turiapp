import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ConfigSite } from "@/lib/db/schema";

async function getSiteConfig(): Promise<ConfigSite | null> {
  try {
    const { data } = await supabase.from("config_site").select("*").eq("id", 1).single();
    return data as ConfigSite | null;
  } catch {
    return null;
  }
}

export default async function Footer() {
  const cfg = await getSiteConfig();

  const nomeSite   = cfg?.nome_site    || "Mimosa Flor";
  const tagline    = cfg?.tagline      || "Casa de Campo · Foz do Iguaçu";
  const descricao  = cfg?.descricao_site || "Uma experiência sensorial única em meio à natureza exuberante do Paraná. Conforto, tranquilidade e aventura a poucos minutos das Cataratas do Iguaçu.";
  const telefone   = cfg?.telefone     || "+55 (45) 9 9999-9999";
  const whatsapp   = cfg?.whatsapp     || "5545999999999";
  const email      = cfg?.email        || "contato@mimosaflor.com.br";
  const endereco   = cfg?.endereco     || "Rua Iguaraçu, n° 140 - Arroio Dourado, Foz do Iguaçu - PR";
  const redes      = cfg?.redes_sociais || {};
  const instagram  = redes.instagram || "https://instagram.com/mimosaflor";
  const facebook   = redes.facebook  || "https://facebook.com/mimosaflor";
  const lat        = cfg?.latitude     ?? -25.571917;
  const lng        = cfg?.longitude    ?? -54.516338;

  return (
    <footer className="bg-[#0f1e16] text-[#FAF7F2]/70 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h2 className="text-[#FAF7F2] text-4xl mb-2 font-display" style={{ fontFamily: "var(--font-display)" }}>
              {nomeSite}
            </h2>
            <p className="text-[#B8963E] text-xs tracking-[0.3em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>
              {tagline}
            </p>
            <p className="text-[#FAF7F2]/60 text-sm leading-relaxed max-w-sm" style={{ fontFamily: "var(--font-body)" }}>
              {descricao}
            </p>
            <div className="flex gap-4 mt-8">
              <a href={instagram} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 border border-[#FAF7F2]/20 flex items-center justify-center hover:border-[#B8963E] hover:text-[#B8963E] transition-colors text-xs font-medium"
                style={{ fontFamily: "var(--font-body)" }}>
                IG
              </a>
              <a href={facebook} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 border border-[#FAF7F2]/20 flex items-center justify-center hover:border-[#B8963E] hover:text-[#B8963E] transition-colors text-xs font-medium"
                style={{ fontFamily: "var(--font-body)" }}>
                FB
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[#FAF7F2] text-xs tracking-[0.25em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>
              Navegação
            </h3>
            <ul className="space-y-3">
              {[
                ["Hospedagem",  "/#hospedagem"],
                ["Ambientes",   "/ambientes"],
                ["Serviços",    "/#servicos"],
                ["Transporte",  "/transporte"],
                ["Experiências","/experiencias"],
                ["Contato",     "/contato"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:text-[#FAF7F2] transition-colors" style={{ fontFamily: "var(--font-body)" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#FAF7F2] text-xs tracking-[0.25em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>
              Contato
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-[#B8963E] mt-0.5 shrink-0" />
                <a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-[#FAF7F2] transition-colors leading-snug" style={{ fontFamily: "var(--font-body)" }}>
                  {endereco}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#B8963E] shrink-0" />
                <a href={`https://wa.me/${whatsapp}`} className="hover:text-[#FAF7F2] transition-colors" style={{ fontFamily: "var(--font-body)" }}>
                  {telefone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#B8963E] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-[#FAF7F2] transition-colors" style={{ fontFamily: "var(--font-body)" }}>
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#FAF7F2]/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#FAF7F2]/40" style={{ fontFamily: "var(--font-body)" }}>
            © {new Date().getFullYear()} {nomeSite}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-[#FAF7F2]/40" style={{ fontFamily: "var(--font-body)" }}>
            <Link href="/sitemap.xml" className="hover:text-[#FAF7F2]/60 transition-colors">Sitemap</Link>
            <Link href="/admin" className="hover:text-[#FAF7F2]/60 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
