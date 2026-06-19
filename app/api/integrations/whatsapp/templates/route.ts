export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";
import { decrypt } from "@/lib/crypto";
import { listWhatsAppTemplates } from "@/lib/whatsapp/360dialog";

// Lista os templates aprovados na conta 360dialog do tenant (puxados ao vivo).
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id obrigatório." }, { status: 400 });

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: integrations } = await service
    .from("tenant_integrations")
    .select("whatsapp_status, whatsapp_api_key_encrypted")
    .eq("tenant_id", tenantId)
    .single();
  if (!integrations || integrations.whatsapp_status !== "connected" || !integrations.whatsapp_api_key_encrypted) {
    return NextResponse.json({ templates: [], connected: false });
  }

  try {
    const apiKey = decrypt(integrations.whatsapp_api_key_encrypted);
    const templates = await listWhatsAppTemplates(apiKey);
    return NextResponse.json({ templates, connected: true });
  } catch {
    return NextResponse.json({ templates: [], connected: true, error: "Não foi possível carregar os modelos do 360dialog." });
  }
}
