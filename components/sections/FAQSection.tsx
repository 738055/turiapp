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
  const items = (cfg.items ?? []).filter((item) => item.question?.trim() || item.answer?.trim());
  return (
    <section className="w-full bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {cfg.title && (
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">FAQ</p>
            <h2 className="text-3xl font-extrabold text-gray-950 md:text-4xl">{cfg.title}</h2>
          </div>
        )}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-[var(--color-primary)]/35">
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-gray-900 hover:bg-gray-50"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.question}
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--color-primary)] transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600">{item.answer}</div>
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
