import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { PageSection, Theme } from "@/types";

interface ContactConfig {
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;
  whatsapp_number?: string;
}

export function ContactSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as ContactConfig;
  const whatsapp = cfg.whatsapp ?? cfg.whatsapp_number;
  const cards = [
    cfg.phone ? { icon: Phone, label: "Telefone", value: cfg.phone, href: `tel:${cfg.phone}` } : null,
    cfg.email ? { icon: Mail, label: "E-mail", value: cfg.email, href: `mailto:${cfg.email}` } : null,
    cfg.address ? { icon: MapPin, label: "Endereco", value: cfg.address, href: null } : null,
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];

  return (
    <section className="w-full bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {cfg.title && (
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">Contato</p>
            <h2 className="text-3xl font-extrabold text-gray-950 md:text-4xl">{cfg.title}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center shadow-sm">
              <Icon className="mx-auto mb-4 h-6 w-6 text-[var(--color-primary)]" />
              <p className="text-sm text-gray-500">{label}</p>
              {href ? <a href={href} className="mt-1 block font-bold text-gray-900">{value}</a> : <p className="mt-1 font-bold text-gray-900">{value}</p>}
            </div>
          ))}
        </div>
        {whatsapp && (
          <div className="mt-8 text-center">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-7 py-3 font-bold text-white transition-colors hover:bg-green-600"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
