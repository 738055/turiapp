"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  Palette,
  CreditCard,
  Settings2,
  CalendarCheck,
  Users,
  UserPlus,
  Puzzle,
  ChevronRight,
  Globe,
  Target,
  FileSignature,
  Zap,
  MessageCircle,
  BarChart3,
  Gift,
  Star,
  Ticket,
} from "lucide-react";
import { roleAtLeast, type TenantRole } from "@/lib/auth/roles";

const navItems: { label: string; href: string; icon: typeof LayoutDashboard; minRole?: TenantRole }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Reservas", href: "/reservas", icon: CalendarCheck },
  { label: "Leads", href: "/leads", icon: Target },
  { label: "Cotações", href: "/cotacoes", icon: FileSignature },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Automações", href: "/automacoes", icon: Zap },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Fidelidade", href: "/fidelidade", icon: Gift },
  { label: "Cupons", href: "/cupons", icon: Ticket, minRole: "tenant_admin" },
  { label: "Avaliações", href: "/avaliacoes", icon: Star },
  { label: "Páginas", href: "/paginas", icon: FileText },
  { label: "Aparência", href: "/temas", icon: Palette },
  { label: "Pagamentos", href: "/pagamentos", icon: CreditCard, minRole: "tenant_owner" },
  { label: "Integrações", href: "/integracoes", icon: Puzzle, minRole: "tenant_admin" },
  { label: "Equipe", href: "/equipe", icon: UserPlus, minRole: "tenant_admin" },
  { label: "Configurações", href: "/configuracoes", icon: Settings2 },
];

interface AdminSidebarProps {
  tenantName: string;
  tenantSlug: string;
  role: string;
}

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";

export function AdminSidebar({ tenantName, tenantSlug, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.minRole || roleAtLeast(role, item.minRole));

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--color-sidebar,#1e293b)] text-[var(--color-sidebar-text,#cbd5e1)]">
      {/* Logo / Tenant name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg bg-[var(--color-primary,#0ea5e9)] flex items-center justify-center text-white font-bold text-sm">
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{tenantName}</p>
          <p className="text-xs text-slate-400 truncate">{tenantSlug}.{PLATFORM_HOST}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {isActive && (
                <ChevronRight className="ml-auto h-3 w-3 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* View storefront link */}
      <div className="border-t border-white/10 p-3">
        <a
          href={`https://${tenantSlug}.${PLATFORM_HOST}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/5 hover:text-white transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          Ver minha loja
        </a>
      </div>
    </aside>
  );
}
