"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { NavItem, Theme } from "@/types";

export function PublicHeader({
  tenantName,
  theme,
  navItems,
}: {
  tenantName: string;
  theme: Theme | null;
  navItems: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const menuType = theme?.menu_type ?? "top-classic";
  const transparent = menuType === "top-transparent";
  const centered = menuType === "top-centered";
  const sidebar = menuType === "sidebar";
  const logoUrl = theme?.logo_url;
  const links = navItems.length
    ? navItems
    : [
        { id: "inicio", tenant_id: "", label: "Inicio", href: "/", order: 0, target: "_self" as const },
        { id: "produtos", tenant_id: "", label: "Produtos", href: "/busca", order: 1, target: "_self" as const },
        { id: "contato", tenant_id: "", label: "Contato", href: "/contato", order: 2, target: "_self" as const },
      ];

  if (sidebar) {
    return (
      <>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[var(--color-secondary)] px-7 py-8 text-white lg:block">
          <Brand tenantName={tenantName} logoUrl={logoUrl} />
          <nav className="mt-12 space-y-2">
            {links.map((item) => <NavLink key={item.id} item={item} sidebar />)}
          </nav>
        </aside>
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Brand tenantName={tenantName} logoUrl={logoUrl} compact dark />
            <button onClick={() => setOpen((value) => !value)} className="rounded-md border border-gray-200 p-2 text-gray-700" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {open && <MobileMenu links={links} />}
        </header>
      </>
    );
  }

  return (
    <header className={`${transparent ? "absolute inset-x-0 top-0 border-white/10 bg-transparent text-white" : "sticky top-0 border-gray-100 bg-white/95 text-gray-900 shadow-sm backdrop-blur"} z-40 border-b`}>
      <div className={`mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8 ${centered ? "justify-center gap-10" : "justify-between gap-6"}`}>
        <Brand tenantName={tenantName} logoUrl={logoUrl} dark={!transparent} />
        <nav className={`hidden items-center gap-7 text-sm font-semibold md:flex ${centered ? "" : "justify-end"}`}>
          {links.map((item) => <NavLink key={item.id} item={item} />)}
        </nav>
        {!centered && (
          <button onClick={() => setOpen((value) => !value)} className={`rounded-md border p-2 md:hidden ${transparent ? "border-white/20 text-white" : "border-gray-200 text-gray-700"}`} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>
      {open && <MobileMenu links={links} transparent={transparent} />}
    </header>
  );
}

function Brand({
  tenantName,
  logoUrl,
  compact = false,
  dark = false,
}: {
  tenantName: string;
  logoUrl?: string | null;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      {logoUrl ? (
        <span className="relative h-10 w-10 overflow-hidden rounded bg-white/90 p-1 shadow-sm">
          <Image src={logoUrl} alt={tenantName} fill className="object-contain p-1" sizes="40px" />
        </span>
      ) : (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded font-bold ${dark ? "bg-[var(--color-primary)] text-white" : "bg-white/15 text-white"}`}>
          {tenantName.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className={`truncate font-bold ${compact ? "max-w-[220px]" : "max-w-[280px]"} text-base`} style={{ fontFamily: "var(--font-heading)" }}>
        {tenantName}
      </span>
    </Link>
  );
}

function NavLink({ item, sidebar = false }: { item: NavItem; sidebar?: boolean }) {
  const external = item.target === "_blank";
  const className = sidebar
    ? "block rounded-lg px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
    : "transition hover:text-[var(--color-accent)]";

  if (external) {
    return <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{item.label}</a>;
  }
  return <Link href={item.href} className={className}>{item.label}</Link>;
}

function MobileMenu({ links, transparent = false }: { links: NavItem[]; transparent?: boolean }) {
  return (
    <nav className={`border-t px-4 py-3 md:hidden ${transparent ? "border-white/10 bg-[var(--color-secondary)] text-white" : "border-gray-100 bg-white text-gray-900"}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-1">
        {links.map((item) => {
          const className = "rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-black/5";
          if (item.target === "_blank") {
            return <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{item.label}</a>;
          }
          return <Link key={item.id} href={item.href} className={className}>{item.label}</Link>;
        })}
      </div>
    </nav>
  );
}
