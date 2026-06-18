export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProductReportData } from "@/lib/reports/data";
import { ProductReportDocument } from "@/lib/reports/ProductReportDocument";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const data = await getProductReportData(membership.tenant_id, id);
  if (!data) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const buffer = await renderToBuffer(<ProductReportDocument data={data} />);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-produto-${id}.pdf"`,
    },
  });
}
