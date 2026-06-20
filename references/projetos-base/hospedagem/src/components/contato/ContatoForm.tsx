"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Send, CheckCircle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const schema = z.object({
  nome:      z.string().min(2, "Nome obrigatório"),
  email:     z.string().email("E-mail inválido"),
  telefone:  z.string().optional(),
  mensagem:  z.string().min(10, "Mensagem muito curta"),
  checkin:   z.string().optional(),
  checkout:  z.string().optional(),
  hospedes:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  whatsapp?: string;
  whatsappMensagemContato?: string;
}

export default function ContatoForm({
  whatsapp = "5545999999999",
  whatsappMensagemContato = "Olá! Gostaria de informações sobre a Mimosa Flor.",
}: Props) {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
  });

  const inputClass = "w-full bg-transparent border-b border-[#1C3A2A]/20 py-3 text-[#1C3A2A] placeholder-[#1C3A2A]/30 focus:outline-none focus:border-[#C4623A] transition-colors text-sm";

  const onSubmit = async (data: unknown) => {
    const d = data as FormData;
    await new Promise((r) => setTimeout(r, 1200));
    const msg = `Olá! Me chamo ${d.nome}.\n\n${d.mensagem}${d.checkin ? `\n\nCheck-in: ${d.checkin}` : ""}${d.checkout ? ` | Check-out: ${d.checkout}` : ""}${d.hospedes ? `\nHóspedes: ${d.hospedes}` : ""}\n\nE-mail: ${d.email}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <CheckCircle className="w-16 h-16 text-[#B8963E] mx-auto mb-6" strokeWidth={1} />
        <h2 className="text-[#1C3A2A] text-3xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
          Mensagem enviada!
        </h2>
        <p className="text-[#1C3A2A]/60" style={{ fontFamily: "var(--font-body)" }}>
          Redirecionamos você para o WhatsApp. Responderemos em breve.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <input {...register("nome")} placeholder="Seu nome *" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            {errors.nome && <p className="text-[#C4623A] text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <input {...register("email")} type="email" placeholder="Seu e-mail *" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
            {errors.email && <p className="text-[#C4623A] text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <input {...register("telefone")} placeholder="WhatsApp / Telefone" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <label className="text-[#1C3A2A]/40 text-xs tracking-wider uppercase mb-1 block" style={{ fontFamily: "var(--font-body)" }}>Check-in</label>
            <input {...register("checkin")} type="date" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
          </div>
          <div>
            <label className="text-[#1C3A2A]/40 text-xs tracking-wider uppercase mb-1 block" style={{ fontFamily: "var(--font-body)" }}>Check-out</label>
            <input {...register("checkout")} type="date" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
          </div>
          <div>
            <label className="text-[#1C3A2A]/40 text-xs tracking-wider uppercase mb-1 block" style={{ fontFamily: "var(--font-body)" }}>Hóspedes</label>
            <input {...register("hospedes")} type="number" min={1} max={20} placeholder="Ex: 4" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
          </div>
        </div>

        <div>
          <textarea {...register("mensagem")} rows={5} placeholder="Sua mensagem *" className={`${inputClass} resize-none`} style={{ fontFamily: "var(--font-body)" }} />
          {errors.mensagem && <p className="text-[#C4623A] text-xs mt-1">{errors.mensagem.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-10 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:bg-[#d4754e] hover:-translate-y-0.5 disabled:opacity-60"
          style={{ fontFamily: "var(--font-body)" }}>
          {isSubmitting ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar mensagem</>}
        </button>
      </form>

      <div className="bg-[#1C3A2A] p-8 mt-12">
        <p className="text-[#B8963E] text-[11px] tracking-[0.25em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>
          Atendimento rápido
        </p>
        <p className="text-[#FAF7F2]/70 text-sm mb-6" style={{ fontFamily: "var(--font-body)" }}>
          Para respostas mais rápidas, entre em contato diretamente pelo WhatsApp.
        </p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMensagemContato)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-sm tracking-widest uppercase font-medium hover:bg-[#d4754e] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}
