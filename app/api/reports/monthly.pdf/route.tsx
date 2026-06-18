export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getMonthlyReportData } from "@/lib/reports/data";
import { MonthlyReportDocument } from "@/lib/reports/MonthlyReportDocument";

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

  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parâmetro 'month' inválido. Use o formato AAAA-MM." }, { status: 400 });
  }

  const data = await getMonthlyReportData(membership.tenant_id, month);
  const buffer = await renderToBuffer(<MonthlyReportDocument data={data} />);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${month}.pdf"`,
    },
  });
}
