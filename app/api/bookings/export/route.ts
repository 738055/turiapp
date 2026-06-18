export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");

  let query = supabase
    .from("bookings")
    .select("id, status, customer_name, customer_email, customer_phone, check_in, check_out, guests, total_price, currency, payment_provider, created_at, products(title)")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status) query = query.eq("status", status);

  const { data: bookings } = await query;

  const STATUS_PT: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Concluída",
    refunded: "Reembolsada",
  };

  const headers = [
    "Código",
    "Status",
    "Produto",
    "Cliente",
    "E-mail",
    "Telefone",
    "Check-in",
    "Check-out",
    "Pessoas",
    "Total",
    "Moeda",
    "Pagamento",
    "Data da reserva",
  ];

  function esc(v: string | null | undefined): string {
    if (!v) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows = (bookings ?? []).map((b) => {
    const product = (b.products as unknown as { title: string } | null)?.title ?? "";
    return [
      b.id.slice(0, 8).toUpperCase(),
      STATUS_PT[b.status] ?? b.status,
      product,
      b.customer_name,
      b.customer_email,
      b.customer_phone ?? "",
      b.check_in ?? "",
      b.check_out ?? "",
      String(b.guests ?? ""),
      String(b.total_price ?? ""),
      b.currency ?? "BRL",
      b.payment_provider ?? "",
      b.created_at ? new Date(b.created_at as string).toLocaleString("pt-BR") : "",
    ].map(esc).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
  const bom = "﻿"; // UTF-8 BOM for Excel compatibility

  await writeAuditLog({
    tenant_id: membership.tenant_id,
    user_id: user.id,
    action: "bookings.export_csv",
    resource: "bookings",
    ip_address: getClientIp(req),
    metadata: { status_filter: status, row_count: rows.length },
  });

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservas-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
