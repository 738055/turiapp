export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getMonthlyReportData } from "@/lib/reports/data";
import { MonthlyReportDocument } from "@/lib/reports/MonthlyReportDocument";
import { sendEmail, renderMonthlyReportEmailHtml } from "@/lib/email/resend";
import { writeAuditLog } from "@/lib/audit";

function previousMonth(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1, 1));
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no servidor." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const service = createServiceClient();
  const month = previousMonth();
  const monthLabel = formatMonthLabel(month);

  const { data: tenants } = await service
    .from("tenants")
    .select("id, slug, name")
    .in("status", ["active", "trial"]);

  let sent = 0;
  let failed = 0;

  for (const tenant of tenants ?? []) {
    try {
      const [data, { data: members }] = await Promise.all([
        getMonthlyReportData(tenant.id, month),
        service
          .from("tenant_members")
          .select("user_id")
          .eq("tenant_id", tenant.id)
          .in("role", ["tenant_owner", "tenant_admin"]),
      ]);

      if (!members?.length) continue;

      const buffer = await renderToBuffer(<MonthlyReportDocument data={data} />);
      const html = renderMonthlyReportEmailHtml({
        tenantName: tenant.name,
        monthLabel,
        revenue: data.revenue,
        currency: data.currency,
        bookingsCount: data.bookingsCount,
        newCustomers: data.newCustomers,
        primaryColor: data.primaryColor,
      });

      for (const member of members) {
        const { data: authUser } = await service.auth.admin.getUserById(member.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        await sendEmail({
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
          to: email,
          subject: `Relatório mensal — ${monthLabel}`,
          html,
          attachments: [{ filename: `relatorio-${month}.pdf`, content: Buffer.from(buffer) }],
        });
      }
      sent++;
    } catch {
      failed++;
    }
  }

  await writeAuditLog({
    action: "reports.monthly_email_cron",
    resource: "tenants",
    metadata: { month, tenants: tenants?.length ?? 0, sent, failed },
  });

  return NextResponse.json({ month, tenants: tenants?.length ?? 0, sent, failed });
}
