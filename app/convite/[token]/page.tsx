import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hashInviteToken } from "@/lib/team/invites";
import { AcceptInvite } from "@/components/admin/AcceptInvite";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: "Administrador",
  tenant_staff: "Atendimento",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-sky-500 mb-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TuriApp</h1>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">{children}</div>
      </div>
    </div>
  );
}

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const service = createServiceClient();
  const tokenHash = hashInviteToken(token);

  const { data: invite } = await service
    .from("invites")
    .select("tenant_id, email, role, expires_at, accepted_at, revoked_at, tenants(name)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const tenantName = (invite?.tenants as unknown as { name: string } | null)?.name ?? "esta empresa";

  if (!invite || invite.revoked_at) {
    return (
      <Shell>
        <h2 className="text-lg font-semibold text-gray-900">Convite inválido</h2>
        <p className="text-sm text-gray-500 mt-2">Este convite não existe mais ou foi revogado.</p>
      </Shell>
    );
  }
  if (invite.accepted_at) {
    return (
      <Shell>
        <h2 className="text-lg font-semibold text-gray-900">Convite já utilizado</h2>
        <p className="text-sm text-gray-500 mt-2">
          Este convite já foi aceito. <Link href="/login" className="text-sky-600 hover:underline">Entrar</Link>
        </p>
      </Shell>
    );
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return (
      <Shell>
        <h2 className="text-lg font-semibold text-gray-900">Convite expirado</h2>
        <p className="text-sm text-gray-500 mt-2">Peça à equipe de {tenantName} para enviar um novo convite.</p>
      </Shell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const roleLabel = ROLE_LABELS[invite.role] ?? invite.role;

  // Not logged in — guide the user to authenticate with the invited email.
  if (!user) {
    const next = encodeURIComponent(`/convite/${token}`);
    return (
      <Shell>
        <h2 className="text-lg font-semibold text-gray-900">Convite para {tenantName}</h2>
        <p className="text-sm text-gray-500 mt-2">
          Você foi convidado como <strong>{roleLabel}</strong>. Entre ou crie sua conta com o e-mail{" "}
          <strong>{invite.email}</strong> para aceitar.
        </p>
        <div className="mt-5 space-y-2">
          <Link
            href={`/login?next=${next}`}
            className="block w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            Já tenho conta — Entrar
          </Link>
          <Link
            href={`/cadastro?next=${next}`}
            className="block w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Criar conta
          </Link>
        </div>
      </Shell>
    );
  }

  // Logged in with the wrong account.
  if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Shell>
        <h2 className="text-lg font-semibold text-gray-900">E-mail diferente</h2>
        <p className="text-sm text-gray-500 mt-2">
          Este convite foi enviado para <strong>{invite.email}</strong>, mas você está logado como{" "}
          <strong>{user.email}</strong>. Saia e entre com o e-mail convidado para aceitar.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h2 className="text-lg font-semibold text-gray-900">Convite para {tenantName}</h2>
      <p className="text-sm text-gray-500 mt-2">
        Você entrará como <strong>{roleLabel}</strong> usando <strong>{invite.email}</strong>.
      </p>
      <div className="mt-5">
        <AcceptInvite token={token} />
      </div>
    </Shell>
  );
}
