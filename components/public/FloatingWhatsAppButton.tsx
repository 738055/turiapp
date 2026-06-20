import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppButtonProps {
  enabled?: boolean | null;
  mode?: "native" | "script" | string | null;
  phone?: string | null;
  label?: string | null;
  message?: string | null;
  script?: string | null;
}

export function FloatingWhatsAppButton({
  enabled,
  mode,
  phone,
  label,
  message,
  script,
}: FloatingWhatsAppButtonProps) {
  if (!enabled) return null;

  if (mode === "script") {
    if (!script?.trim()) return null;
    return <div id="floating-whatsapp-script" dangerouslySetInnerHTML={{ __html: script }} />;
  }

  const cleanPhone = phone?.replace(/\D/g, "") ?? "";
  if (!cleanPhone) return null;

  const href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    message?.trim() || "Ola! Vim pelo site e gostaria de atendimento."
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label={label?.trim() || "Fale conosco no WhatsApp"}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">{label?.trim() || "Fale conosco"}</span>
    </a>
  );
}
