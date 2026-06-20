"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Home,
  Wrench,
  Car,
  Image,
  Search,
  Megaphone,
  Settings,
  LogOut,
  Layout,
  ChevronDown,
  MessageSquare,
  MapPin,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/hospedagens",  label: "Hospedagens",  icon: Home },
  { href: "/admin/servicos",     label: "Serviços",     icon: Wrench },
  { href: "/admin/transporte",   label: "Transporte",   icon: Car },
  { href: "/admin/midia",        label: "Mídia",        icon: Image },
  { href: "/admin/seo",          label: "SEO & Indexação", icon: Search },
  { href: "/admin/marketing",    label: "Marketing",    icon: Megaphone },
  { href: "/admin/configuracoes",label: "Configurações",icon: Settings },
];

const contentItems = [
  { href: "/admin/conteudo/hero",         label: "Hero (capa)",   icon: Layout },
  { href: "/admin/conteudo/cta",          label: "CTA final",     icon: Zap },
  { href: "/admin/conteudo/depoimentos",  label: "Depoimentos",   icon: MessageSquare },
  { href: "/admin/conteudo/localizacao",  label: "Localização",   icon: MapPin },
  { href: "/admin/conteudo/paginas",      label: "Textos/Páginas",icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isContentActive = pathname.startsWith("/admin/conteudo");
  const [contentOpen, setContentOpen] = useState(isContentActive);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#1C3A2A] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[#FAF7F2]/10">
        <h1 className="text-[#FAF7F2] text-xl mb-0.5" style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>Mimosa Flor</h1>
        <p className="text-[#B8963E] text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: "var(--font-body)" }}>Painel Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href} className="relative">
                <Link href={href}
                  className={cn(
                    "relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm transition-all overflow-hidden",
                    active ? "text-[#FAF7F2]" : "text-[#FAF7F2]/50 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/5"
                  )}
                  style={{ fontFamily: "var(--font-body)" }}>
                  <AnimatePresence>
                    {active && (
                      <motion.span layoutId="active-nav-bar"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#B8963E]"
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                    )}
                  </AnimatePresence>
                  {active && (
                    <motion.div layoutId="active-nav-bg"
                      className="absolute inset-0 bg-[#FAF7F2]/10"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 relative z-10 transition-colors", active ? "text-[#B8963E]" : "")} strokeWidth={1.5} />
                  <span className="relative z-10">{label}</span>
                </Link>
              </li>
            );
          })}

          {/* Conteúdo group */}
          <li className="mt-4">
            <div className="px-4 mb-2">
              <p className="text-[#FAF7F2]/20 text-[9px] tracking-[0.3em] uppercase" style={{ fontFamily: "var(--font-body)" }}>Conteúdo do site</p>
            </div>
            <button
              onClick={() => setContentOpen(!contentOpen)}
              className={cn(
                "relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm transition-all overflow-hidden w-full",
                isContentActive ? "text-[#FAF7F2]" : "text-[#FAF7F2]/50 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/5"
              )}
              style={{ fontFamily: "var(--font-body)" }}>
              <Layout className={cn("w-4 h-4 shrink-0 relative z-10 transition-colors", isContentActive ? "text-[#B8963E]" : "")} strokeWidth={1.5} />
              <span className="relative z-10 flex-1 text-left">Conteúdo</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", contentOpen ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
              {contentOpen && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  {contentItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <li key={href}>
                        <Link href={href}
                          className={cn(
                            "flex items-center gap-3 pl-10 pr-3 py-2 text-xs transition-all",
                            active ? "text-[#FAF7F2] bg-[#FAF7F2]/10" : "text-[#FAF7F2]/40 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/5"
                          )}
                          style={{ fontFamily: "var(--font-body)" }}>
                          <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-[#B8963E]" : "")} strokeWidth={1.5} />
                          {label}
                          {active && <span className="ml-auto w-1 h-1 rounded-full bg-[#B8963E]" />}
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-6 py-6 border-t border-[#FAF7F2]/10 space-y-3">
        <Link href="/" target="_blank"
          className="flex items-center gap-2 text-[#FAF7F2]/40 text-xs hover:text-[#FAF7F2]/60 transition-colors"
          style={{ fontFamily: "var(--font-body)" }}>
          <Home className="w-3.5 h-3.5" /> Ver site público
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/admin" })}
          className="flex items-center gap-2 text-[#FAF7F2]/40 text-xs hover:text-[#C4623A] transition-colors w-full"
          style={{ fontFamily: "var(--font-body)" }}>
          <LogOut className="w-3.5 h-3.5" /> Sair
        </button>
      </div>
    </aside>
  );
}
