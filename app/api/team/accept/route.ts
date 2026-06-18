export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { hashInviteToken } from "@/lib/team/invites";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Você precisa estar logado para aceitar o convite." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });

  const service = createServiceClient();
  const tokenHash = hashInviteToken(parsed.data.token);

  const { data: invite } = await service
    .from("invites")
    .select("id, tenant_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite || invite.revoked_at) {
    return NextResponse.json({ error: "Convite inválido ou revogado." }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 409 });
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Este convite expirou. Peça um novo." }, { status: 410 });
  }

  // Bind the invite to its email: the logged-in user must own the invited
  // address. Stops a forwarded link from being redeemed by another account.
  if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Este convite foi enviado para outro e-mail. Faça login com o e-mail convidado." },
      { status: 403 }
    );
  }

  // The data model (and current_user_tenant_id helper) assumes one tenant per
  // user. Block joining a second tenant rather than silently breaking isolation.
  const { data: existing } = await service
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id);

  if ((existing ?? []).some((m) => m.tenant_id === invite.tenant_id)) {
    // Already a member of this tenant — just mark the invite consumed.
    await service.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
    return NextResponse.json({ ok: true, alreadyMember: true });
  }
  if ((existing ?? []).length > 0) {
    return NextResponse.json(
      { error: "Sua conta já está vinculada a outra empresa. Use outro e-mail para esta equipe." },
      { status: 409 }
    );
  }

  const { error: insertError } = await service.from("tenant_members").insert({
    tenant_id: invite.tenant_id,
    user_id: user.id,
    role: invite.role,
  });

  if (insertError) {
    return NextResponse.json({ error: "Erro ao entrar na equipe. Tente novamente." }, { status: 500 });
  }

  // Ensure a profile row exists (mirrors onboarding).
  await service.from("user_profiles").upsert({ id: user.id }, { onConflict: "id" });

  await service.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  await writeAuditLog({
    tenant_id: invite.tenant_id,
    user_id: user.id,
    action: "team.invite_accepted",
    resource: "tenant_members",
    ip_address: getClientIp(req),
    metadata: { role: invite.role, invite_id: invite.id },
  });

  return NextResponse.json({ ok: true });
}
