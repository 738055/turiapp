export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "media";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const tenantId = form.get("tenant_id") as string | null;
  const folder = (form.get("folder") as string | null) ?? "misc";

  if (!file || !tenantId) {
    return NextResponse.json({ error: "Arquivo e tenant_id são obrigatórios." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify membership
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${tenantId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    // If bucket doesn't exist, surface a clear error
    if (uploadError.message.includes("Bucket not found")) {
      return NextResponse.json(
        { error: 'Bucket "media" não encontrado. Crie-o no Supabase Storage.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl, path: filename });
}

// Allow deleting own uploads
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { path, tenant_id } = await req.json() as { path: string; tenant_id: string };
  if (!path || !tenant_id) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Path must start with tenant_id/ for security
  if (!path.startsWith(`${tenant_id}/`)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const service = createServiceClient();
  await service.storage.from(BUCKET).remove([path]);

  return NextResponse.json({ ok: true });
}
