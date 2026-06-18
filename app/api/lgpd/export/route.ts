export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  tenant_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { email, tenant_id } = parsed.data;
  const service = createServiceClient();

  const { data: customer } = await service
    .from("customers")
    .select("id, name, email, phone, created_at")
    .eq("tenant_id", tenant_id)
    .eq("email", email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Nenhum dado encontrado para este e-mail." }, { status: 404 });
  }

  const { data: bookings } = await service
    .from("bookings")
    .select("id, status, total_price, currency, check_in, check_out, guests, created_at")
    .eq("tenant_id", tenant_id)
    .eq("customer_email", email);

  const { data: leads } = await service
    .from("leads")
    .select("id, status, message, source, created_at")
    .eq("tenant_id", tenant_id)
    .eq("email", email);

  const leadIds = (leads ?? []).map((l) => l.id);
  const { data: quotes } = leadIds.length
    ? await service
        .from("quotes")
        .select("id, status, total_price, currency, check_in, check_out, expires_at, created_at")
        .in("lead_id", leadIds)
    : { data: [] };

  await writeAuditLog({
    tenant_id,
    user_id: user?.id ?? null,
    action: "lgpd.data_export",
    resource: "customers",
    resource_id: customer.id,
    ip_address: getClientIp(req),
    metadata: { email },
  });

  return NextResponse.json({
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      registered_at: customer.created_at,
    },
    bookings: bookings ?? [],
    leads: leads ?? [],
    quotes: quotes ?? [],
    exported_at: new Date().toISOString(),
  });
}
