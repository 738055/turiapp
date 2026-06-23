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

const DELAYS = ["", "tf-delay-1", "tf-delay-2"];

export function ContactSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as ContactConfig;
  const whatsapp = cfg.whatsapp ?? cfg.whatsapp_number;
  const cards = [
    cfg.phone ? { icon: Phone, label: "Telefone", value: cfg.phone, href: `tel:${cfg.phone}` } : null,
    cfg.email ? { icon: Mail, label: "E-mail", value: cfg.email, href: `mailto:${cfg.email}` } : null,
    cfg.address ? { icon: MapPin, label: "Endereco", value: cfg.address, href: null } : null,
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];

  return (
    <section className="w-full bg-[var(--color-background)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {cfg.title && (
          <div className="tf-reveal mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">Contato</p>
            <h2 className="text-3xl font-extrabold text-[var(--color-text)] md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              {cfg.title}
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map(({ icon: Icon, label, value, href }, i) => (
            <div
              key={label}
              className={`tf-reveal ${DELAYS[i] ?? ""} group rounded-2xl border border-gray-200/70 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-lg`}
            >
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
              {href ? (
                <a href={href} className="mt-1.5 block font-bold text-gray-900 transition-colors hover:text-[var(--color-primary)]">
                  {value}
                </a>
              ) : (
                <p className="mt-1.5 font-bold text-gray-900">{value}</p>
              )}
            </div>
          ))}
        </div>
        {whatsapp && (
          <div className="tf-reveal tf-delay-3 mt-9 text-center">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-green-500/25 transition-all hover:-translate-y-0.5 hover:bg-green-600"
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
