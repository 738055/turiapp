import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, link, read_at, created_at")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-gray-500 text-sm mt-1">Avisos gerados pelas automações configuradas na sua loja.</p>
      </div>

      <div className="space-y-2">
        {notifications?.map((n) => (
          <Card key={n.id}>
            <CardContent className="flex items-start justify-between gap-3 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                  {!n.read_at && <Badge variant="default">Nova</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {!notifications?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhuma notificação ainda. Quando uma automação criar um aviso interno, ele aparece aqui.
          </div>
        )}
      </div>
    </div>
  );
}
