import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWhatsAppTemplate } from "@/lib/whatsapp/templates";

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: logs } = await supabase
    .from("whatsapp_logs")
    .select("id, phone, template, status, error, sent_at")
    .eq("tenant_id", membership!.tenant_id)
    .order("sent_at", { ascending: false })
    .limit(200);

  const total = logs?.length ?? 0;
  const sent = logs?.filter((l) => l.status === "sent").length ?? 0;
  const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">
          Histórico de mensagens disparadas via WhatsApp Business API.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-xl">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-400">Disparos (últimos 200)</p>
            <p className="text-2xl font-bold mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-400">Entregues</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-400">Taxa de entrega</p>
            <p className="text-2xl font-bold mt-1">{deliveryRate === null ? "—" : `${deliveryRate}%`}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex items-start justify-between gap-3 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {getWhatsAppTemplate(log.template)?.label ?? log.template}
                  </p>
                  <Badge variant={log.status === "sent" ? "success" : "destructive"}>
                    {log.status === "sent" ? "Enviado" : "Falhou"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{log.phone}</p>
                {log.error && <p className="text-xs text-red-500 mt-1">{log.error}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(log.sent_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {!logs?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhuma mensagem disparada ainda. Conecte o WhatsApp Business em Integrações e configure uma automação.
          </div>
        )}
      </div>
    </div>
  );
}
