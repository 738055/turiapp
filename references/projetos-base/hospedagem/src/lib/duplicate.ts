import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateUniqueSlug(
  supabase: SupabaseClient,
  table: string,
  baseSlug: string
): Promise<string> {
  let candidate = `${baseSlug}-copia`;
  let attempt = 0;

  while (true) {
    const slug = attempt === 0 ? candidate : `${baseSlug}-copia-${attempt}`;
    const { data } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    attempt++;
    if (attempt > 99) throw new Error("Não foi possível gerar slug único");
  }
}
