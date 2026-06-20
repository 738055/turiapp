"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  FileSignature,
  FileText,
  Gift,
  Globe,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Package,
  Palette,
  Puzzle,
  Settings2,
  Star,
  Target,
  Ticket,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { roleAtLeast, type TenantRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type NavIcon = typeof LayoutDashboard;
type NavItem = { label: string; href: string; icon: NavIcon; minRole?: TenantRole };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Visao geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Relatorios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Loja e aparencia",
    items: [
      { label: "Produtos", href: "/produtos", icon: Package },
      { label: "Reservas", href: "/reservas", icon: CalendarCheck },
      { label: "Aparencia", href: "/temas", icon: Palette },
      { label: "Paginas", href: "/paginas", icon: FileText },
      { label: "Cupons", href: "/cupons", icon: Ticket, minRole: "tenant_admin" },
      { label: "Avaliacoes", href: "/avaliacoes", icon: Star },
      { label: "Fidelidade", href: "/fidelidade", icon: Gift },
    ],
  },
  {
    label: "CRM e vendas",
    items: [
      { label: "Leads", href: "/leads", icon: Target },
      { label: "Cotacoes", href: "/cotacoes", icon: FileSignature },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Atendimento", href: "/conversas", icon: Inbox },
      { label: "Automacoes", href: "/automacoes", icon: Zap },
    ],
  },
  {
    label: "Canais e ajustes",
    items: [
      { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
      { label: "Pagamentos", href: "/pagamentos", icon: CreditCard, minRole: "tenant_owner" },
      { label: "Integracoes", href: "/integracoes", icon: Puzzle, minRole: "tenant_admin" },
      { label: "Equipe", href: "/equipe", icon: UserPlus, minRole: "tenant_admin" },
      { label: "Configuracoes", href: "/configuracoes", icon: Settings2 },
    ],
  },
];

interface AdminSidebarProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
}

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";

export function AdminSidebar({ tenantId, tenantName, tenantSlug, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.minRole || roleAtLeast(role, item.minRole)),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    const load = () => {
      fetch(`/api/conversations/unread-count?tenant_id=${tenantId}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) setUnread(data.count ?? 0);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 20_000);
    return () => clearInterval(interval);
  }, [tenantId]);

  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--color-sidebar,#1e293b)] text-[var(--color-sidebar-text,#cbd5e1)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary,#0ea5e9)] text-sm font-bold text-white">
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{tenantName}</p>
          <p className="truncate text-xs text-slate-400">{tenantSlug}.{PLATFORM_HOST}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-2">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive ? "bg-white/10 font-medium text-white" : "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.href === "/conversas" && unread > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                    {isActive && !(item.href === "/conversas" && unread > 0) && (
                      <ChevronRight className="ml-auto h-3 w-3 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <a
          href={`https://${tenantSlug}.${PLATFORM_HOST}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/5 hover:text-white"
        >
          <Globe className="h-3.5 w-3.5" />
          Ver minha loja
        </a>
      </div>
    </aside>
  );
}
