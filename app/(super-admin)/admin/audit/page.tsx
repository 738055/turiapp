export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AuditPage() {
  const service = createServiceClient();

  const { data: logs } = await service
    .from("audit_logs")
    .select("*, tenants(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Logs de auditoria</h1>
        <p className="text-gray-400 text-sm mt-1">Últimas 100 ações registradas</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-3 text-gray-400 font-medium">Data</th>
                <th className="text-left p-3 text-gray-400 font-medium">Tenant</th>
                <th className="text-left p-3 text-gray-400 font-medium">Ação</th>
                <th className="text-left p-3 text-gray-400 font-medium">Recurso</th>
                <th className="text-left p-3 text-gray-400 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => {
                const tenant = log.tenants as unknown as { name: string; slug: string } | null;
                return (
                  <tr key={log.id} className="border-b border-gray-800 last:border-0">
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 text-gray-300">{tenant?.name ?? "—"}</td>
                    <td className="p-3">
                      <span className="font-mono text-amber-300">{log.action}</span>
                    </td>
                    <td className="p-3 text-gray-400 font-mono">{log.resource}</td>
                    <td className="p-3 text-gray-500 font-mono">{log.ip_address ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!logs?.length && (
            <p className="text-center text-gray-600 py-8 text-sm">Nenhum log registrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
