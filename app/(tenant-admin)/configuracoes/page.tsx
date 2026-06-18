import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TenantSettingsForm } from "@/components/admin/TenantSettingsForm";
import {
  CreditCard,
  Globe,
  Puzzle,
  ChevronRight,
  Target,
  ShieldCheck,
} from "lucide-react";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(name, slug, locale)")
    .eq("user_id", user!.id)
    .single();

  const tenant = membership?.tenants as unknown as { name: string; slug: string; locale: string } | null;

  const quickLinks = [
    { href: "/configuracoes/assinatura", icon: CreditCard, label: "Assinatura e plano", desc: "Seu plano atual, upgrades e faturas" },
    { href: "/configuracoes/dominio", icon: Globe, label: "Domínio próprio", desc: "Use seu próprio domínio (ex: www.meusite.com.br)" },
    { href: "/pagamentos", icon: CreditCard, label: "Formas de pagamento", desc: "Stripe e Mercado Pago" },
    { href: "/integracoes", icon: Puzzle, label: "Integrações & SEO", desc: "Pixels, Analytics, LGPD" },
    { href: "/configuracoes/crm", icon: Target, label: "Pontuação de clientes (CRM)", desc: "Faixas de tier e segmentação automática" },
    { href: "/configuracoes/seguranca", icon: ShieldCheck, label: "Segurança", desc: "Verificação em duas etapas (TOTP)" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os dados e preferências da sua conta</p>
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-sky-200 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tenant general settings */}
      <TenantSettingsForm
        tenantId={membership!.tenant_id}
        initialName={tenant?.name ?? ""}
        initialLocale={tenant?.locale ?? "pt-BR"}
        tenantSlug={tenant?.slug ?? ""}
      />
    </div>
  );
}
