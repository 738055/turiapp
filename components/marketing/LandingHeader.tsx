"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Menu, X } from "lucide-react";

const NAV = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "Perguntas", href: "#faq" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-gray-900">TuriApp</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800"
          >
            Criar conta grátis
          </Link>
        </div>

        <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/login" className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700">
              Entrar
            </Link>
            <Link href="/cadastro" className="rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white">
              Criar conta grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
