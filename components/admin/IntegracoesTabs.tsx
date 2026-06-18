"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Geral", href: "/integracoes" },
  { label: "Webhooks", href: "/integracoes/webhooks" },
  { label: "API pública", href: "/integracoes/api" },
];

export function IntegracoesTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
              isActive
                ? "border-[var(--color-primary,#0ea5e9)] text-[var(--color-primary,#0ea5e9)] font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
