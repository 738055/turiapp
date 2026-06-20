import type { PageSection, Theme } from "@/types";
import { Phone, Mail, MapPin } from "lucide-react";

interface ContactConfig { title?: string; email?: string; phone?: string; address?: string; whatsapp?: string; whatsapp_number?: string }

export function ContactSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as ContactConfig;
  const whatsapp = cfg.whatsapp ?? cfg.whatsapp_number;
  return (
    <section className="py-12 px-6 max-w-4xl mx-auto w-full">
      {cfg.title && <h2 className="text-3xl font-bold text-center mb-8">{cfg.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cfg.phone && (
          <div className="flex flex-col items-center gap-2 text-center p-6 rounded-[var(--radius)] border">
            <Phone className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm text-gray-500">Telefone</p>
            <a href={`tel:${cfg.phone}`} className="font-semibold">{cfg.phone}</a>
          </div>
        )}
        {cfg.email && (
          <div className="flex flex-col items-center gap-2 text-center p-6 rounded-[var(--radius)] border">
            <Mail className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm text-gray-500">E-mail</p>
            <a href={`mailto:${cfg.email}`} className="font-semibold">{cfg.email}</a>
          </div>
        )}
        {cfg.address && (
          <div className="flex flex-col items-center gap-2 text-center p-6 rounded-[var(--radius)] border">
            <MapPin className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm text-gray-500">Endereço</p>
            <p className="font-semibold">{cfg.address}</p>
          </div>
        )}
      </div>
      {whatsapp && (
        <div className="mt-6 text-center">
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-[var(--radius)] font-semibold hover:bg-green-600 transition-colors"
          >
            💬 Falar no WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}
