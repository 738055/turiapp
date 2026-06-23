"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSection, Theme } from "@/types";

interface FAQItem { question: string; answer: string }
interface FAQConfig { title?: string; items?: FAQItem[] }

export function FAQSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as FAQConfig;
  const [open, setOpen] = useState<number | null>(0);
  const items = (cfg.items ?? []).filter((item) => item.question?.trim() || item.answer?.trim());

  return (
    <section className="w-full bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {cfg.title && (
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]">FAQ</p>
            <h2 className="text-3xl font-extrabold text-gray-950 md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              {cfg.title}
            </h2>
          </div>
        )}
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white transition-all",
                  isOpen ? "border-[var(--color-primary)]/40 shadow-md" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <button
                  className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isOpen ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[15px] font-bold leading-snug text-gray-900">{item.question}</span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </button>
                <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-16 text-sm leading-relaxed text-gray-600 sm:px-6 sm:pl-[4.25rem]">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
