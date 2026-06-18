"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSection, Theme } from "@/types";

interface FAQItem { question: string; answer: string }
interface FAQConfig { title?: string; items?: FAQItem[] }

export function FAQSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as FAQConfig;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-12 px-6 max-w-3xl mx-auto w-full">
      {cfg.title && <h2 className="text-3xl font-bold text-center mb-8">{cfg.title}</h2>}
      <div className="space-y-2">
        {(cfg.items ?? []).map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-[var(--radius)] overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-gray-50"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.question}
              <ChevronDown className={cn("h-4 w-4 transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-gray-600">{item.answer}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
