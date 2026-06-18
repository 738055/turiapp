export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  tenant_id: z.string().uuid(),
  confirm: z.literal(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos ou confirmação ausente." }, { status: 400 });
  }

  const { email, tenant_id } = parsed.data;
  const service = createServiceClient();

  // Verify the requester is owner/admin of this tenant
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin", "tenant_owner", "tenant_admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("email", email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Nenhum dado encontrado." }, { status: 404 });
  }

  // Anonymize bookings (LGPD: manter registros financeiros, anonimizar PII)
  await service
    .from("bookings")
    .update({
      customer_name: "[removido]",
      customer_email: "[removido]",
      customer_phone: null,
      customer_id: null,
    })
    .eq("tenant_id", tenant_id)
    .eq("customer_email", email);

  // Delete customer record
  await service.from("customers").delete().eq("id", customer.id);

  // Anonymize leads tied to this email (keep pipeline/financial history, strip PII)
  await service
    .from("leads")
    .update({ name: "[removido]", email: "[removido]", phone: null, message: null })
    .eq("tenant_id", tenant_id)
    .eq("email", email);

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "lgpd.data_deletion",
    resource: "customers",
    resource_id: customer.id,
    ip_address: getClientIp(req),
    metadata: { email },
  });

  return NextResponse.json({ ok: true, message: "Dados do titular removidos conforme LGPD." });
}
