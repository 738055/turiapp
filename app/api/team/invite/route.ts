export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { assignableRoles } from "@/lib/auth/roles";
import {
  generateInviteToken,
  hashInviteToken,
  checkTeamLimit,
  INVITE_TTL_MS,
} from "@/lib/team/invites";
import { sendEmail, renderInviteEmailHtml } from "@/lib/email/resend";

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: "Administrador",
  tenant_staff: "Atendimento",
};

const schema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["tenant_admin", "tenant_staff"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { tenant_id, email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const service = createServiceClient();

  // Caller must be a member of this tenant.
  const { data: membership } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  // The caller can only assign roles at or below their own authority. This is
  // what stops a tenant_admin from minting another admin (or an owner).
  if (!assignableRoles(membership.role).includes(role)) {
    return NextResponse.json(
      { error: "Você não tem permissão para convidar com este nível de acesso." },
      { status: 403 }
    );
  }

  // Plan seat limit (members + outstanding invites).
  const limit = await checkTeamLimit(tenant_id);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          limit.max === 1
            ? "Seu plano permite apenas 1 usuário. Faça upgrade para convidar a equipe."
            : `Seu plano permite até ${limit.max} usuários. Faça upgrade para adicionar mais.`,
      },
      { status: 403 }
    );
  }

  // Already a member? Look up by email via Auth admin (emails live in auth.users).
  const { data: existingMembers } = await service
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenant_id);
  for (const m of existingMembers ?? []) {
    const { data: au } = await service.auth.admin.getUserById(m.user_id);
    if (au?.user?.email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: "Este e-mail já faz parte da equipe." }, { status: 409 });
    }
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  // Replace any previous pending invite for this email (the partial unique index
  // only allows one live invite per email per tenant).
  await service
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("tenant_id", tenant_id)
    .ilike("email", normalizedEmail)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const { data: invite, error } = await service
    .from("invites")
    .insert({
      tenant_id,
      email: normalizedEmail,
      role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Erro ao criar convite." }, { status: 500 });
  }

  // Send the email (best effort — the invite is already persisted).
  const [{ data: tenant }, { data: theme }, { data: inviterProfile }] = await Promise.all([
    service.from("tenants").select("name, slug").eq("id", tenant_id).single(),
    service.from("themes").select("primary_color").eq("tenant_id", tenant_id).maybeSingle(),
    service.from("user_profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? process.env.NEXT_PUBLIC_PLATFORM_HOST ?? "turiapp.com.br";
  const acceptUrl = `https://app.${platformDomain}/convite/${token}`;

  if (tenant) {
    try {
      await sendEmail({
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        to: normalizedEmail,
        subject: `Convite para a equipe de ${tenant.name}`,
        html: renderInviteEmailHtml({
          tenantName: tenant.name,
          roleLabel: ROLE_LABELS[role] ?? role,
          inviterName: inviterProfile?.full_name ?? null,
          acceptUrl,
          expiresAt,
          primaryColor: theme?.primary_color ?? undefined,
        }),
      });
    } catch {
      // Email failure must not lose the invite; the admin can resend.
    }
  }

  await writeAuditLog({
    tenant_id,
    user_id: user.id,
    action: "team.invite_created",
    resource: "invites",
    resource_id: invite.id,
    ip_address: getClientIp(req),
    metadata: { email: normalizedEmail, role },
  });

  return NextResponse.json({ ok: true });
}
