import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Small inline "Pro" badge for gated controls. */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ${className}`}>
      <Sparkles className="h-2.5 w-2.5" />
      PRO
    </span>
  );
}

/** Full-card lock shown in place of a feature that the tenant's plan doesn't include. */
export function PlanLockCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center text-center gap-3 py-10">
        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 flex items-center justify-center gap-2">
            {title} <ProBadge />
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
        </div>
        <Link
          href="/configuracoes/assinatura"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary, #0ea5e9)" }}
        >
          Ver planos e fazer upgrade
        </Link>
      </CardContent>
    </Card>
  );
}
