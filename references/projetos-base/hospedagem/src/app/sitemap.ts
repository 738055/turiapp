import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import type { Hospedagem, Servico } from "@/lib/db/schema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mimosaflor.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ambientes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/transporte`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/experiencias`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contato`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const [hospedagensRes, servicosRes] = await Promise.all([
      supabase.from("hospedagens").select("slug, updated_at").eq("status", "ativo"),
      supabase.from("servicos").select("slug, updated_at, created_at").eq("disponivel", true),
    ]);

    const hospedagens = (hospedagensRes.data as Pick<Hospedagem, "slug" | "updated_at">[] | null) || [];
    const servicos = (servicosRes.data as Pick<Servico, "slug" | "updated_at" | "created_at">[] | null) || [];

    const hospedagemPages = hospedagens.map((item) => ({
      url: `${SITE_URL}/hospedagem/${item.slug}`,
      lastModified: item.updated_at || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));

    const servicoPages = servicos.map((item) => ({
      url: `${SITE_URL}/servicos/${item.slug}`,
      lastModified: item.updated_at || item.created_at || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...hospedagemPages, ...servicoPages];
  } catch {
    return staticPages;
  }
}
