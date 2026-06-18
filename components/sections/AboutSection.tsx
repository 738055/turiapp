import Image from "next/image";
import type { PageSection, Theme } from "@/types";

interface AboutConfig { title?: string; text?: string; image_url?: string }

export function AboutSection({ section }: { section: PageSection; theme: Theme | null; tenantId: string }) {
  const cfg = (section.config ?? {}) as AboutConfig;
  return (
    <section className="py-12 px-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-10 items-center">
        {cfg.image_url && (
          <div className="relative h-64 w-full md:w-1/2 rounded-[var(--radius)] overflow-hidden flex-shrink-0">
            <Image src={cfg.image_url} alt={cfg.title ?? ""} fill className="object-cover" />
          </div>
        )}
        <div>
          {cfg.title && <h2 className="text-3xl font-bold mb-4">{cfg.title}</h2>}
          {cfg.text && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{cfg.text}</p>}
        </div>
      </div>
    </section>
  );
}
