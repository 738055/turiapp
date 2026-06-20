import { Briefcase, Camera, Clock, Mail, MapPin, MessageCircle, Music2, Phone, Play, Share2 } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface FooterConfig {
  company_name?: string;
  description?: string;
  variant?: "dark" | "light" | "brand";
  quick_links_title?: string;
  contact_title?: string;
  social_title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  address?: string;
  hours?: string;
  legal_text?: string;
  links?: { label: string; href: string }[];
  social?: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string; linkedin?: string };
}

export function FooterSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as FooterConfig;
  const year = new Date().getFullYear();
  const variant = cfg.variant ?? "dark";
  const isLight = variant === "light";
  const whatsapp = cfg.whatsapp ?? cfg.whatsapp_number;
  const links = cfg.links?.length
    ? cfg.links
    : [
        { label: "Produtos", href: "/busca" },
        { label: "FAQ", href: "/faq" },
        { label: "Termos", href: "/termos" },
        { label: "Privacidade", href: "/privacidade" },
      ];
  const contactItems = [
    cfg.phone ? { icon: Phone, label: "Telefone", value: cfg.phone, href: `tel:${cfg.phone}` } : null,
    whatsapp ? { icon: MessageCircle, label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` } : null,
    cfg.email ? { icon: Mail, label: "E-mail", value: cfg.email, href: `mailto:${cfg.email}` } : null,
    cfg.address ? { icon: MapPin, label: "Endereco", value: cfg.address, href: null } : null,
    cfg.hours ? { icon: Clock, label: "Horario", value: cfg.hours, href: null } : null,
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];
  const socialLinks = [
    socialItem("Instagram", cfg.social?.instagram, Camera, "instagram"),
    socialItem("Facebook", cfg.social?.facebook, Share2, "facebook"),
    socialItem("TikTok", cfg.social?.tiktok, Music2, "tiktok"),
    socialItem("YouTube", cfg.social?.youtube, Play, "youtube"),
    socialItem("LinkedIn", cfg.social?.linkedin, Briefcase, "linkedin"),
  ].filter(Boolean) as { label: string; href: string; icon: typeof Camera }[];
  const textMuted = isLight ? "text-gray-500" : "text-white/65";
  const textMain = isLight ? "text-gray-950" : "text-white";
  const border = isLight ? "border-gray-200" : "border-white/10";
  const surface = isLight ? "bg-white" : "bg-white/5";
  const background =
    variant === "brand"
      ? "linear-gradient(135deg, var(--color-secondary), var(--color-primary))"
      : isLight
        ? "var(--color-background)"
        : "var(--color-secondary)";

  return (
    <footer className={`mt-auto border-t px-4 py-14 sm:px-6 lg:px-8 ${textMain} ${border}`} style={{ background }}>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr_0.8fr]">
        <div className="max-w-md">
          {cfg.company_name && (
            <p className="mb-3 text-2xl font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
              {cfg.company_name}
            </p>
          )}
          {cfg.description && <p className={`text-sm leading-relaxed ${textMuted}`}>{cfg.description}</p>}
          {cfg.legal_text && <p className={`mt-5 text-xs leading-relaxed ${textMuted}`}>{cfg.legal_text}</p>}
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] opacity-80">{cfg.quick_links_title || "Links uteis"}</p>
          <div className="grid gap-2">
            {links.map((link) => (
              <a
                key={`${link.href}-${link.label}`}
                href={safeHref(link.href)}
                className={`text-sm font-medium transition hover:opacity-100 ${textMuted}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] opacity-80">{cfg.contact_title || "Atendimento"}</p>
          <div className="grid gap-3">
            {contactItems.length > 0 ? (
              contactItems.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <>
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-70" />
                    <span>
                      <span className={`block text-[11px] ${textMuted}`}>{label}</span>
                      <span className="block text-sm font-semibold">{value}</span>
                    </span>
                  </>
                );

                return href ? (
                  <a key={label} href={safeHref(href)} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="flex gap-2 transition hover:opacity-80">
                    {content}
                  </a>
                ) : (
                  <div key={label} className="flex gap-2">
                    {content}
                  </div>
                );
              })
            ) : (
              <p className={`text-sm ${textMuted}`}>Adicione telefone, e-mail, WhatsApp e endereco no painel.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] opacity-80">{cfg.social_title || "Redes sociais"}</p>
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${border} ${surface} transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)] hover:text-white`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textMuted}`}>Conecte Instagram, Facebook, TikTok e outros canais.</p>
          )}
        </div>
      </div>
      <div className={`mx-auto mt-10 max-w-7xl border-t pt-5 text-xs ${border} ${textMuted}`}>
        &copy; {year} {cfg.company_name ?? "TuriApp"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}

function socialItem(
  label: string,
  value: string | undefined,
  icon: typeof Camera,
  network: "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin"
) {
  const href = socialHref(value, network);
  return href ? { label, href, icon } : null;
}

function socialHref(value: string | undefined, network: "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin") {
  const clean = value?.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  const user = clean.replace(/^@/, "").replace(/^\/+/, "");
  const bases = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/@",
    youtube: "https://youtube.com/",
    linkedin: "https://linkedin.com/company/",
  };
  return `${bases[network]}${user}`;
}

function safeHref(href: string) {
  const clean = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(clean)) return clean;
  return "#";
}
