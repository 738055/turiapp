"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Mail, Trash2, ShieldCheck, Clock } from "lucide-react";
import { roleAtLeast, assignableRoles, type TenantRole } from "@/lib/auth/roles";

interface Member {
  id: string;
  user_id: string;
  role: string;
  email: string;
  created_at: string;
  isSelf: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface SeatLimit {
  allowed: boolean;
  max: number;
  used: number;
}

interface TeamManagerProps {
  tenantId: string;
  currentUserRole: string;
  members: Member[];
  invites: Invite[];
  seatLimit: SeatLimit;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  tenant_owner: "Proprietário",
  owner: "Proprietário",
  tenant_admin: "Administrador",
  tenant_staff: "Atendimento",
};

export function TeamManager({ tenantId, currentUserRole, members, invites, seatLimit }: TeamManagerProps) {
  const router = useRouter();
  const isOwner = roleAtLeast(currentUserRole, "tenant_owner");
  const invitable = assignableRoles(currentUserRole);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantRole>(invitable[invitable.length - 1] ?? "tenant_staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const seatsFull = seatLimit.max !== -1 && seatLimit.used >= seatLimit.max;

  async function post(url: string, payload: Record<string, unknown>): Promise<boolean> {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Ocorreu um erro. Tente novamente.");
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const ok = await post("/api/team/invite", { tenant_id: tenantId, email, role });
    if (ok) {
      setSuccess(`Convite enviado para ${email}.`);
      setEmail("");
      router.refresh();
    }
  }

  async function handleRevoke(inviteId: string) {
    if (await post("/api/team/invite/revoke", { tenant_id: tenantId, invite_id: inviteId })) {
      router.refresh();
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    if (await post("/api/team/member/update-role", { tenant_id: tenantId, member_id: memberId, role: newRole })) {
      router.refresh();
    }
  }

  async function handleRemove(memberId: string, memberEmail: string) {
    if (!window.confirm(`Remover ${memberEmail} da equipe? Esta pessoa perderá o acesso ao painel.`)) return;
    if (await post("/api/team/member/remove", { tenant_id: tenantId, member_id: memberId })) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Equipe</h1>
        <p className="text-gray-500 text-sm mt-1">
          Convide pessoas para ajudar a gerenciar sua loja e defina o nível de acesso de cada uma.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{success}</p>}

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
            Convidar membro
          </CardTitle>
          <CardDescription>
            {seatLimit.max === -1
              ? `${seatLimit.used} ${seatLimit.used === 1 ? "membro" : "membros"} na equipe (ilimitado no seu plano).`
              : `${seatLimit.used} de ${seatLimit.max} ${seatLimit.max === 1 ? "vaga usada" : "vagas usadas"} no seu plano.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seatsFull ? (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
              Você atingiu o limite de usuários do seu plano. Faça upgrade em Configurações → Assinatura para
              convidar mais pessoas.
            </p>
          ) : (
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pessoa@empresa.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Acesso</Label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as TenantRole)}
                  className="h-10 rounded-[var(--radius)] border border-gray-200 bg-white px-3 text-sm"
                >
                  {invitable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Enviando..." : "Enviar convite"}
              </Button>
            </form>
          )}
          <p className="text-xs text-gray-400 mt-3">
            <strong>Administrador</strong>: acesso a quase tudo, exceto pagamentos e exclusão da conta.{" "}
            <strong>Atendimento</strong>: reservas, clientes, leads e produtos — sem acesso a pagamentos,
            integrações ou faturamento.
          </p>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => {
            const canEdit = isOwner && !m.isSelf && m.role !== "tenant_owner" && m.role !== "owner" && m.role !== "super_admin";
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5">
                    {(m.role === "tenant_owner" || m.role === "owner") && <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" />}
                    {m.email}
                    {m.isSelf && <span className="text-xs text-gray-400">(você)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{ROLE_LABELS[m.role] ?? m.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canEdit && (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      disabled={busy}
                      className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
                    >
                      <option value="tenant_admin">Administrador</option>
                      <option value="tenant_staff">Atendimento</option>
                    </select>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => handleRemove(m.id, m.email)}
                      disabled={busy}
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convites pendentes ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {inv.email}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ROLE_LABELS[inv.role] ?? inv.role} · expira em {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600" onClick={() => handleRevoke(inv.id)} disabled={busy}>
                  Revogar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
