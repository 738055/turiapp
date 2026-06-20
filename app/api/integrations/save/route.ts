export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { getPlanLimits, featureAllowed } from "@/lib/plans/limits";

// Pixel/analytics fields gated by the plan's pixel_integrations flag. head_scripts
// is included because it's the loophole to paste a pixel script manually.
const PIXEL_FIELDS = [
  "google_analytics_id",
  "google_tag_manager_id",
  "facebook_pixel_id",
  "tiktok_pixel_id",
  "google_ads_id",
  "head_scripts",
] as const;

const schema = z.object({
  tenant_id: z.string().uuid(),
  google_analytics_id: z.string().max(50).optional(),
  google_tag_manager_id: z.string().max(50).optional(),
  facebook_pixel_id: z.string().max(50).optional(),
  tiktok_pixel_id: z.string().max(50).optional(),
  google_ads_id: z.string().max(50).optional(),
  whatsapp_number: z.string().max(30).optional(),
  floating_whatsapp_enabled: z.boolean().default(false),
  floating_whatsapp_mode: z.enum(["native", "script"]).default("native"),
  floating_whatsapp_label: z.string().max(80).optional(),
  floating_whatsapp_message: z.string().max(500).optional(),
  floating_whatsapp_script: z.string().max(10000).optional(),
  cookie_consent_enabled: z.boolean().default(true),
  cookie_consent_text: z.string().max(500).optional(),
  privacy_policy_url: z.string().url().optional().or(z.literal("")),
  head_scripts: z.string().max(10000).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { tenant_id, ...fields } = parsed.data;
  const service = createServiceClient();

  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["tenant_owner", "tenant_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  // Plan gate: pixels/analytics are a paid feature. Block only if the tenant is
  // actually trying to set a pixel value (saving cookie consent / WhatsApp alone
  // stays allowed on any plan).
  const limits = await getPlanLimits(service, tenant_id);
  if (!featureAllowed(limits, "pixel_integrations")) {
    const settingPixel = PIXEL_FIELDS.some((f) => {
      const v = (fields as Record<string, unknown>)[f];
      return typeof v === "string" && v.trim() !== "";
    });
    const settingScriptWidget =
      fields.floating_whatsapp_mode === "script" ||
      (typeof fields.floating_whatsapp_script === "string" && fields.floating_whatsapp_script.trim() !== "");
    if (settingPixel || settingScriptWidget) {
      return NextResponse.json(
        { error: "Pixels e Analytics não estão incluídos no seu plano. Faça upgrade para o Pro para ativar rastreamento de marketing." },
        { status: 403 }
      );
    }
  }

  const { error } = await service
    .from("tenant_integrations")
    .upsert(
      {
        tenant_id,
        ...Object.fromEntries(
          Object.entries(fields).map(([k, v]) => [k, v === "" ? null : v])
        ),
      },
      { onConflict: "tenant_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar integrações." }, { status: 500 });
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "integrations.save",
    resource: "tenant_integrations",
    ip_address: getClientIp(req),
    metadata: { fields_changed: Object.keys(fields), head_scripts_changed: "head_scripts" in fields },
  });

  return NextResponse.json({ ok: true });
}
