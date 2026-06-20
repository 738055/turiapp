"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/",             label: "Início" },
  { href: "/#hospedagem",  label: "Hospedagem" },
  { href: "/#servicos",    label: "Serviços" },
  { href: "/transporte",   label: "Transporte" },
  { href: "/experiencias", label: "Experiências" },
  { href: "/contato",      label: "Contato" },
];

interface HeaderProps {
  nomeSite?: string;
  tagline?: string;
  whatsapp?: string;
  whatsappMensagem?: string;
}

export default function Header({
  nomeSite = "Mimosa Flor",
  tagline = "Casa de Campo",
  whatsapp = "5545999999999",
  whatsappMensagem = "Olá, gostaria de fazer uma reserva na Mimosa Flor!",
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMensagem)}`;

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled ? "bg-[#1C3A2A]/95 backdrop-blur-md shadow-lg" : "bg-transparent")}>
      <nav className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="text-[#FAF7F2] font-display text-2xl tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            {nomeSite}
          </span>
          <span className="text-[#B8963E] text-[10px] tracking-[0.3em] uppercase font-body">
            {tagline}
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}
                className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] text-sm tracking-wide transition-colors duration-200 relative group"
                style={{ fontFamily: "var(--font-body)" }}>
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#B8963E] transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#C4623A] text-white px-5 py-2.5 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:bg-[#d4754e] hover:-translate-y-0.5"
            style={{ fontFamily: "var(--font-body)" }}>
            <Phone className="w-3.5 h-3.5" />
            Reservar
          </a>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-[#FAF7F2] p-2" aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#1C3A2A] border-t border-[#FAF7F2]/10">
            <ul className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.li key={link.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={link.href} onClick={() => setOpen(false)}
                    className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] text-lg font-display block py-1"
                    style={{ fontFamily: "var(--font-display)" }}>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: navLinks.length * 0.06 }}>
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#C4623A] text-white px-6 py-3 text-sm tracking-widest uppercase font-medium mt-2"
                  style={{ fontFamily: "var(--font-body)" }}>
                  <Phone className="w-3.5 h-3.5" /> Reservar agora
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
