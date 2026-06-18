export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getDomainConfig } from "@/lib/vercel";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const service = createServiceClient();

  const { data: domainRow } = await service
    .from("tenant_domains")
    .select("domain, verification_status, ssl_status")
    .eq("tenant_id", membership.tenant_id)
    .eq("type", "custom")
    .maybeSingle();

  if (!domainRow) return NextResponse.json({ status: "not_found" });

  // Already fully live (DNS verified + SSL issued) — nothing to poll.
  if (domainRow.verification_status === "verified" && domainRow.ssl_status === "issued") {
    return NextResponse.json({ status: "ready", verification_status: "verified", ssl_status: "issued" });
  }

  // Check with Vercel.
  const config = await getDomainConfig(domainRow.domain);
  if (!config) {
    return NextResponse.json({
      status: "pending",
      verification_status: domainRow.verification_status,
      ssl_status: domainRow.ssl_status,
    });
  }

  // State machine:
  //   not verified           → pending  (DNS not pointing yet)
  //   just became verified   → verified + ssl 'pending'  (= certificate issuing)
  //   verified on a prior poll→ verified + ssl 'issued'   (= live & secure)
  // The ssl values stay inside the DB check constraint ('pending','issued','failed').
  let newVerification: "pending" | "verified";
  let newSsl: "pending" | "issued";
  let status: "pending" | "issuing" | "ready";

  if (!config.verified) {
    newVerification = "pending";
    newSsl = "pending";
    status = "pending";
  } else if (domainRow.verification_status !== "verified") {
    newVerification = "verified";
    newSsl = "pending"; // certificate is being provisioned by Vercel
    status = "issuing";
  } else {
    newVerification = "verified";
    newSsl = "issued";
    status = "ready";
  }

  if (newVerification !== domainRow.verification_status || newSsl !== domainRow.ssl_status) {
    await service
      .from("tenant_domains")
      .update({
        verification_status: newVerification,
        ssl_status: newSsl,
        vercel_config: { verification: config.verification ?? [] },
      })
      .eq("domain", domainRow.domain)
      .eq("tenant_id", membership.tenant_id);
  }

  return NextResponse.json({ status, verification_status: newVerification, ssl_status: newSsl });
}
