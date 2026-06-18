import { createClient, createServiceClient } from "@/lib/supabase/server";
import { LoyaltySettingsForm } from "@/components/admin/LoyaltySettingsForm";
import { DEFAULT_LOYALTY_SETTINGS } from "@/lib/loyalty/settings";
import { getLoyaltyRanking } from "@/lib/loyalty/ledger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default async function FidelidadePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const tenantId = membership!.tenant_id;
  const service = createServiceClient();

  const [{ data: settings }, ranking] = await Promise.all([
    service
      .from("loyalty_settings")
      .select("active, earn_mode, points_per_amount, points_per_booking, redeem_value_per_point, min_redeem_points")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    getLoyaltyRanking(tenantId, 10),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Programa de fidelidade</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure como seus clientes ganham e resgatam pontos. As alterações entram em vigor
          imediatamente na sua loja.
        </p>
      </div>

      <LoyaltySettingsForm tenantId={tenantId} initialValues={settings ?? DEFAULT_LOYALTY_SETTINGS} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking de clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhum ponto registrado ainda. Ative o programa para começar a pontuar reservas confirmadas.
            </p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.customerId} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-gray-400 w-5">{i + 1}º</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.email}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-sky-600 flex-shrink-0">{r.balance} pts</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
