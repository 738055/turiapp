export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { roleAtLeast } from "@/lib/auth/roles";

// Soma de mensagens não lidas em conversas abertas — para o badge do menu.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ count: 0 });

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !roleAtLeast(membership.role, "tenant_staff")) {
    return NextResponse.json({ count: 0 });
  }

  const { data } = await service
    .from("conversations")
    .select("unread_count")
    .eq("tenant_id", tenantId)
    .gt("unread_count", 0);

  const count = (data ?? []).reduce((s, c) => s + (c.unread_count ?? 0), 0);
  return NextResponse.json({ count });
}
