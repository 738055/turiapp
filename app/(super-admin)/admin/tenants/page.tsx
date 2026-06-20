export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TenantsPage() {
  const service = createServiceClient();

  const { data: tenants } = await service
    .from("tenants")
    .select("id, name, slug, status, subscription_status, plan_id, created_at, plans(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Todos os clientes</h1>
        <p className="text-gray-400 text-sm mt-1">{tenants?.length ?? 0} clientes cadastrados</p>
      </div>

      <div className="space-y-2">
        {tenants?.map((t) => {
          const plan = t.plans as unknown as { name: string } | null;
          return (
            <Card key={t.id} className="bg-gray-900 border-gray-800">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">{t.name}</p>
                  <p className="text-gray-500 text-xs font-mono">{t.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  {plan && (
                    <span className="text-xs text-gray-400">{plan.name}</span>
                  )}
                  <Badge
                    variant={t.subscription_status === "active" ? "success" : "secondary"}
                  >
                    {t.subscription_status ?? "trial"}
                  </Badge>
                  <Badge
                    variant={t.status === "active" ? "default" : "secondary"}
                  >
                    {t.status}
                  </Badge>
                  <Button variant="outline" size="sm" asChild className="border-gray-700 text-gray-300">
                    <Link href={`/admin/tenants/${t.id}`}>Gerenciar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
