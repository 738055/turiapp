import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  hospedagem: "🏡 Hospedagem",
  receptivo: "🗺️ Receptivo",
  emissivo: "✈️ Emissivo",
};

export default async function ProdutosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, type, module, status, sale_mode, updated_at, rates:product_rates(price, currency, available)")
    .eq("tenant_id", membership!.tenant_id)
    .order("created_at", { ascending: false });

  const grouped = (products ?? []).reduce<Record<string, typeof products>>((acc, p) => {
    if (!p) return acc;
    const mod = p.module as string;
    if (!acc[mod]) acc[mod] = [];
    acc[mod]!.push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie sua oferta turística</p>
        </div>
        <Button asChild style={{ backgroundColor: "#0ea5e9" }}>
          <Link href="/produtos/novo">
            <Plus className="h-4 w-4 mr-1" /> Novo produto
          </Link>
        </Button>
      </div>

      {Object.entries(grouped).map(([module, items]) => (
        <div key={module}>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            {MODULE_LABELS[module] ?? module}
          </h2>
          <div className="space-y-2">
            {items?.map((p) => {
              const rates = (p.rates as { price: number; currency: string; available?: boolean }[] | null)
                ?.filter((rate) => rate.available !== false);
              const lowestRate = rates?.reduce(
                (min, r) => (r.price < min.price ? r : min),
                rates[0]
              );
              return (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{p.type}</span>
                          {lowestRate && (
                            <span className="text-xs font-medium text-sky-600">
                              A partir de {formatCurrency(lowestRate.price, lowestRate.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.sale_mode === "booking" ? "default" : "secondary"}>
                        {p.sale_mode === "booking" ? "💳 Reserva" : "💬 WhatsApp"}
                      </Badge>
                      <Badge variant={p.status === "published" ? "success" : "secondary"}>
                        {p.status === "published" ? "Publicado" : p.status === "draft" ? "Rascunho" : "Arquivado"}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/produtos/${p.id}`}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {!products?.length && (
        <div className="text-center py-16 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Nenhum produto ainda</p>
          <p className="text-sm mt-1 mb-4">
            Adicione pousadas, passeios, pacotes e muito mais
          </p>
          <Button asChild style={{ backgroundColor: "#0ea5e9" }}>
            <Link href="/produtos/novo">
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro produto
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
