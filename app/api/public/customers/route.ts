export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateApiKey, isApiKeyAuthError } from "@/lib/api-keys/auth";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (isApiKeyAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("per_page") ?? "20")));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await createServiceClient()
    .from("customers")
    .select("id, name, email, phone, created_at", { count: "exact" })
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: "Erro ao listar clientes." }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: { page, per_page: perPage, total: count ?? 0 },
  });
}
