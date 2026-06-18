import type { createServiceClient } from "@/lib/supabase/server";
import { parseIcalBusyRanges, expandDays } from "@/lib/ical";

type Service = ReturnType<typeof createServiceClient>;

export interface IcalImportRow {
  id: string;
  product_id: string;
  url: string;
  source_label: string | null;
}

/**
 * Fetch an external .ics, parse its busy dates, and reflect them as availability
 * blocks for the product. Blocks created here are tagged with note "iCal:<label>"
 * so a re-sync can replace exactly this feed's dates without touching manual
 * blocks. Never throws — records last_error instead.
 */
export async function syncIcalImport(service: Service, imp: IcalImportRow): Promise<{ ok: boolean; days: number; error?: string }> {
  const label = imp.source_label || "externo";
  const note = `iCal:${label}`;
  try {
    const res = await fetch(imp.url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "TuriApp-iCal/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const ranges = parseIcalBusyRanges(text);
    const days = new Set<string>();
    for (const r of ranges) for (const d of expandDays(r.start, r.end)) days.add(d);

    // Replace this feed's previous blocks, then apply the current ones.
    await service.from("availability").delete().eq("product_id", imp.product_id).eq("note", note);

    if (days.size > 0) {
      const rows = Array.from(days).map((date) => ({
        product_id: imp.product_id,
        date,
        available_slots: 0,
        blocked: true,
        note,
      }));
      // Upsert so a feed date that already has a row becomes blocked too.
      await service.from("availability").upsert(rows, { onConflict: "product_id,date" });
    }

    await service
      .from("product_ical_imports")
      .update({ last_synced_at: new Date().toISOString(), last_error: null })
      .eq("id", imp.id);

    return { ok: true, days: days.size };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao sincronizar";
    await service.from("product_ical_imports").update({ last_error: message }).eq("id", imp.id);
    return { ok: false, days: 0, error: message };
  }
}
