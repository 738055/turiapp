import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Eye, Pencil, Home } from "lucide-react";

export default async function PaginasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user!.id)
    .single();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, status, is_home, show_in_nav, nav_order, updated_at")
    .eq("tenant_id", membership!.tenant_id)
    .order("nav_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Páginas</h1>
          <p className="text-gray-500 text-sm mt-1">Crie e edite as páginas do seu site</p>
        </div>
        <Button asChild style={{ backgroundColor: "#0ea5e9" }}>
          <Link href="/paginas/nova">
            <Plus className="h-4 w-4 mr-1" />
            Nova página
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {pages?.map((page) => (
          <Card key={page.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {page.is_home && (
                  <Home className="h-4 w-4 text-sky-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{page.title}</p>
                  <p className="text-xs text-gray-400">/{page.slug}</p>
                </div>
                <Badge variant={page.status === "published" ? "success" : "secondary"}>
                  {page.status === "published" ? "Publicada" : "Rascunho"}
                </Badge>
                {page.show_in_nav && (
                  <Badge variant="outline" className="text-xs">No menu</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/${page.slug === "inicio" ? "" : page.slug}`} target="_blank">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/paginas/${page.id}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!pages?.length && (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-3">Nenhuma página criada ainda.</p>
            <Button asChild size="sm" style={{ backgroundColor: "#0ea5e9" }}>
              <Link href="/paginas/nova">
                <Plus className="h-4 w-4 mr-1" /> Criar primeira página
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
