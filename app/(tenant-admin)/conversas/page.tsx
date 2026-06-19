import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ChatInbox } from "@/components/admin/ChatInbox";
import { getWhatsAppTemplate } from "@/lib/whatsapp/templates";

export const dynamic = "force-dynamic";

export default async function ConversasPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c: initialConversationId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: membership } = await service
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) redirect("/login");

  const { data: integrations } = await service
    .from("tenant_integrations")
    .select("whatsapp_status")
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  // Equipe (para atribuir a conversa a um atendente).
  const { data: members } = await service
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", membership.tenant_id);
  const teamMembers = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: prof } = await service.from("user_profiles").select("full_name").eq("id", m.user_id).maybeSingle();
      let name = prof?.full_name ?? "";
      if (!name) {
        const { data: au } = await service.auth.admin.getUserById(m.user_id);
        name = au?.user?.email ?? "Atendente";
      }
      return { id: m.user_id, name };
    })
  );

  // Templates disponíveis para envio fora da janela de 24h.
  const templateKeys = ["reserva_confirmada", "lembrete_viagem", "pedido_avaliacao", "reativacao_cliente"];
  const templates = templateKeys
    .map((k) => getWhatsAppTemplate(k))
    .filter(Boolean)
    .map((t) => ({ key: t!.key, label: t!.label, paramKeys: t!.paramKeys }));

  return (
    <div className="h-[calc(100vh-7rem)]">
      <ChatInbox
        tenantId={membership.tenant_id}
        currentUserId={user.id}
        whatsappConnected={integrations?.whatsapp_status === "connected"}
        templates={templates}
        teamMembers={teamMembers}
        initialConversationId={initialConversationId ?? null}
      />
    </div>
  );
}
