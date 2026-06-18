import type { PageSection, Theme } from "@/types";
import { HeroSection } from "./HeroSection";
import { ProductGridSection } from "./ProductGridSection";
import { BannerSection } from "./BannerSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FAQSection } from "./FAQSection";
import { NewsletterSection } from "./NewsletterSection";
import { AboutSection } from "./AboutSection";
import { ContactSection } from "./ContactSection";
import { SearchBarSection } from "./SearchBarSection";
import { FooterSection } from "./FooterSection";

interface SectionRendererProps {
  section: PageSection;
  theme: Theme | null;
  tenantId: string;
}

const SECTION_REGISTRY: Record<
  string,
  React.ComponentType<{ section: PageSection; theme: Theme | null; tenantId: string }>
> = {
  hero: HeroSection,
  "product-grid": ProductGridSection,
  "product-carousel": ProductGridSection,
  "search-bar": SearchBarSection,
  banner: BannerSection,
  testimonials: TestimonialsSection,
  faq: FAQSection,
  about: AboutSection,
  contact: ContactSection,
  newsletter: NewsletterSection,
  footer: FooterSection,
};

export function SectionRenderer({ section, theme, tenantId }: SectionRendererProps) {
  const Component = SECTION_REGISTRY[section.type];

  if (!Component) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="border-2 border-dashed border-orange-300 p-4 text-center text-sm text-orange-600">
          Seção desconhecida: <code>{section.type}</code>
        </div>
      );
    }
    return null;
  }

  return <Component section={section} theme={theme} tenantId={tenantId} />;
}
