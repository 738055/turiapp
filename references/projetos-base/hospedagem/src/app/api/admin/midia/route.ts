import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const BUCKET = "mimosaflor";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folder = req.nextUrl.searchParams.get("folder") ?? "";
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder || "", { sortBy: { column: "created_at", order: "desc" } });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder" && !f.id?.endsWith("/"))
    .map((f) => {
      const filePath = folder ? `${folder}/${f.name}` : f.name;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return {
        url: pub.publicUrl,
        path: filePath,
        name: f.name,
        size: f.metadata?.size ?? 0,
        created_at: f.created_at,
      };
    });

  return NextResponse.json(files);
}
