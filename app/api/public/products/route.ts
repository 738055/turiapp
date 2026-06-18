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
  const module_ = searchParams.get("module");
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = createServiceClient()
    .from("products")
    .select("id, module, type, title, slug, description, images, sale_mode, created_at", { count: "exact" })
    .eq("tenant_id", auth.tenantId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (module_) query = query.eq("module", module_);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "Erro ao listar produtos." }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: { page, per_page: perPage, total: count ?? 0 },
  });
}
